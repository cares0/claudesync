import { t } from '../utils/i18n.js';
import { loadConfig } from '../core/auth.js';
import { loadAutoConfig } from '../core/auto-config.js';
import { acquireLock, releaseLock } from '../core/lock.js';
import { appendLog } from '../core/auto-log.js';
import { sendOsNotification, addPendingNotification } from '../core/notify.js';
import { scanFiles } from '../core/scanner.js';
import { getGist, updateGist, createGist, parseMeta } from '../core/gist.js';
import { compareForPush, compareForPull } from '../core/conflict.js';
import { detectSecrets, redactContent } from '../core/redactor.js';
import { encrypt as encryptContent, decrypt, isEncrypted } from '../core/crypto.js';
import { claudeDir, isPathSafe, machineName, platformString, getMachineId } from '../utils/paths.js';
import type { AutoConfig, ScannedFile, PrimaryDevice } from '../types.js';
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { hostname } from 'node:os';

export async function runAutoRun(): Promise<void> {
  const autoConfig = loadAutoConfig();
  if (!autoConfig || !autoConfig.enabled) {
    return; // Silently exit — scheduler might fire after disable
  }

  const authConfig = loadConfig();
  if (!authConfig?.token || !authConfig.gist_id) {
    appendLog(autoConfig.direction, 'error', 'No auth config or gist_id');
    return;
  }

  // Acquire lock
  if (!acquireLock()) {
    appendLog(autoConfig.direction, 'skipped', 'Lock held by another process');
    return;
  }

  try {
    if (autoConfig.direction === 'push') {
      await autoRunPush(autoConfig, authConfig.token, authConfig.gist_id, authConfig.encrypt_passphrase);
    } else {
      await autoRunPull(autoConfig, authConfig.token, authConfig.gist_id, authConfig.encrypt_passphrase);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendLog(autoConfig.direction, 'error', message);
    const failMsg = t('auto_run.failed').replace('{direction}', autoConfig.direction).replace('{message}', message);
    sendOsNotification('claudesync', failMsg);
    addPendingNotification('error', failMsg);
  } finally {
    releaseLock();
  }
}

async function autoRunPush(
  autoConfig: AutoConfig,
  token: string,
  gistId: string,
  passphrase?: string,
): Promise<void> {
  // Check if this machine is still the primary device
  try {
    const gist = await getGist(token, gistId);
    const meta = parseMeta(gist);
    if (meta?.primary_device) {
      const primary = meta.primary_device;
      if (primary.machine_id !== getMachineId()) {
        appendLog('push', 'skipped', `Not primary device (primary: ${primary.machine})`);
        return;
      }
    }
  } catch {
    // If we can't fetch, try to push anyway
  }

  // Scan local files (filtered by categories)
  let files = scanFiles();
  files = files.filter((f) => autoConfig.categories.includes(f.category));

  if (files.length === 0) {
    appendLog('push', 'skipped', 'No files to sync');
    return;
  }

  // Redact secrets
  const processedFiles: ScannedFile[] = files.map((file) => {
    const secrets = detectSecrets(file.content);
    if (secrets.length > 0) {
      return { ...file, content: redactContent(file.content, secrets) };
    }
    return file;
  });

  // Encrypt if configured
  const encryptedFiles = new Set<string>();
  let finalFiles: ScannedFile[];
  if (autoConfig.encrypt) {
    if (!passphrase) {
      appendLog('push', 'error', 'Encryption enabled but no passphrase configured');
      return;
    }
    finalFiles = processedFiles.map((f) => {
      encryptedFiles.add(f.gistFilename);
      return { ...f, content: encryptContent(f.content, passphrase) };
    });
  } else {
    finalFiles = processedFiles;
  }

  // Compare with remote
  try {
    const gist = await getGist(token, gistId);
    const changes = compareForPush(finalFiles, gist);
    const modified = changes.filter((c) => c.status !== 'unchanged');

    if (modified.length === 0) {
      appendLog('push', 'skipped', 'No changes detected');
      return;
    }

    const deletedFiles = changes.filter((c) => c.status === 'deleted').map((c) => c.gistFilename);
    const filesToUpload = finalFiles.filter((f) =>
      changes.some((c) => c.gistFilename === f.gistFilename && c.status !== 'unchanged'),
    );

    const primaryDevice: PrimaryDevice = {
      machine_id: getMachineId(),
      machine: machineName(),
      hostname: hostname(),
      platform: platformString(),
      registered_at: new Date().toISOString(),
    };

    await updateGist(token, gistId, filesToUpload, deletedFiles, encryptedFiles, 'auto-sync push', primaryDevice);
    appendLog('push', 'success', t('auto_run.push_synced').replace('{count}', String(modified.length)));
  } catch (err) {
    if (String(err).includes('404')) {
      const primaryDevice: PrimaryDevice = {
        machine_id: getMachineId(),
        machine: machineName(),
        hostname: hostname(),
        platform: platformString(),
        registered_at: new Date().toISOString(),
      };
      const newGist = await createGist(token, finalFiles, encryptedFiles, 'auto-sync push (new gist)', primaryDevice);
      appendLog('push', 'success', `Created new gist: ${newGist.id}`);
    } else {
      throw err;
    }
  }
}

async function autoRunPull(
  autoConfig: AutoConfig,
  token: string,
  gistId: string,
  passphrase?: string,
): Promise<void> {
  const gist = await getGist(token, gistId);
  const localFiles = scanFiles();
  const filteredLocal = localFiles.filter((f) => autoConfig.categories.includes(f.category));

  const changes = compareForPull(gist, filteredLocal);
  const modified = changes.filter((c) => c.status !== 'unchanged');

  // Filter by configured categories
  const meta = parseMeta(gist);
  const toApply = modified.filter((c) => autoConfig.categories.includes(c.category));

  if (toApply.length === 0) {
    appendLog('pull', 'skipped', 'No changes detected');
    return;
  }

  const base = claudeDir();
  let applied = 0;
  let skipped = 0;

  for (const change of toApply) {
    if (!isPathSafe(change.relativePath)) continue;
    if (change.status === 'deleted') continue;

    const targetPath = join(base, change.relativePath);
    let content = change.remoteContent ?? '';

    // Decrypt if needed
    const metaEntry = meta?.file_map[change.gistFilename];
    const needsDecrypt = metaEntry?.encrypted || isEncrypted(content);
    if (needsDecrypt) {
      if (!passphrase) {
        appendLog('pull', 'error', `No passphrase for encrypted file: ${change.relativePath}`);
        continue;
      }
      try {
        content = decrypt(content, passphrase);
      } catch {
        appendLog('pull', 'error', `Decrypt failed: ${change.relativePath}`);
        continue;
      }
    }

    // Apply conflict policy for modified files
    if (change.status === 'modified' && autoConfig.conflict_policy) {
      switch (autoConfig.conflict_policy) {
        case 'skip':
          if (change.localContent && change.localContent !== content) {
            skipped++;
            continue;
          }
          break;
        case 'backup':
          if (existsSync(targetPath)) {
            copyFileSync(targetPath, targetPath + '.bak');
          }
          break;
        case 'overwrite':
          break;
      }
    }

    // Ensure directory exists
    const dir = dirname(targetPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(targetPath, content, 'utf-8');
    applied++;
  }

  const message = skipped > 0
    ? t('auto_run.pull_applied_skipped').replace('{applied}', String(applied)).replace('{skipped}', String(skipped))
    : t('auto_run.pull_applied').replace('{applied}', String(applied));
  appendLog('pull', 'success', message);
}
