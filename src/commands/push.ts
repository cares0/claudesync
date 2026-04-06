import { t } from '../utils/i18n.js';
import { info, success, warn, error, heading, confirm, c, askHidden } from '../utils/terminal.js';
import { loadConfig, saveConfig } from '../core/auth.js';
import { scanFiles } from '../core/scanner.js';
import { getGist, createGist, updateGist } from '../core/gist.js';
import { compareForPush, simpleDiff } from '../core/conflict.js';
import { detectSecrets, redactContent } from '../core/redactor.js';
import { encrypt as encryptContent } from '../core/crypto.js';
import { printDiff } from '../utils/terminal.js';
import { fromGistFilename } from '../utils/paths.js';
import type { PushOptions, ScannedFile } from '../types.js';

/** Ensure a passphrase is available; prompt if needed and save to config */
async function ensurePassphrase(config: { token: string; gist_id?: string; machine_name?: string; encrypt_passphrase?: string }): Promise<string | null> {
  if (config.encrypt_passphrase) return config.encrypt_passphrase;

  const pp = await askHidden(t('encrypt.enter_passphrase'));
  if (!pp.trim()) return null;
  const confirm2 = await askHidden(t('encrypt.confirm_passphrase'));
  if (pp !== confirm2) {
    error(t('encrypt.mismatch'));
    return null;
  }
  config.encrypt_passphrase = pp;
  saveConfig(config as any);
  success(t('encrypt.passphrase_saved'));
  return pp;
}

export async function runPush(options: PushOptions): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }

  // 1. Scan local files
  info(t('push.scanning'));
  const files = scanFiles(options.only);

  if (files.length === 0) {
    warn(t('push.no_files'));
    return;
  }

  // 2. Detect and redact secrets
  const processedFiles: ScannedFile[] = [];
  for (const file of files) {
    const secrets = detectSecrets(file.content);
    if (secrets.length > 0) {
      warn(t('push.secret_found').replace('{path}', file.relativePath).replace('{count}', String(secrets.length)));
      for (const s of secrets) {
        console.log(`  ${c.dim(`L${s.line}`)} ${c.yellow(s.pattern)}: ${s.match}`);
      }
      const redacted = redactContent(file.content, secrets);
      processedFiles.push({ ...file, content: redacted });
    } else {
      processedFiles.push(file);
    }
  }

  // 3. Encrypt if requested
  let passphrase: string | undefined;
  const encryptedFiles = new Set<string>();
  let finalFiles: ScannedFile[];

  if (options.encrypt) {
    const pp = await ensurePassphrase(config);
    if (!pp) {
      warn(t('push.cancelled'));
      return;
    }
    passphrase = pp;
    finalFiles = processedFiles.map((f) => {
      encryptedFiles.add(f.gistFilename);
      return { ...f, content: encryptContent(f.content, passphrase!) };
    });
  } else {
    finalFiles = processedFiles;
  }

  // 4. Compare with remote
  if (config.gist_id) {
    try {
      const gist = await getGist(config.token, config.gist_id);
      const changes = compareForPush(finalFiles, gist);

      const modified = changes.filter((c) => c.status !== 'unchanged');
      if (modified.length === 0) {
        success(t('push.no_changes'));
        return;
      }

      // Show summary
      heading(t('push.summary'));
      for (const change of modified) {
        const icon =
          change.status === 'added' ? c.green('+') :
          change.status === 'deleted' ? c.red('-') :
          c.yellow('~');
        console.log(`  ${icon} [${change.category}] ${change.relativePath}`);

        if (change.status === 'modified' && change.localContent && change.remoteContent) {
          const diff = simpleDiff(change.remoteContent, change.localContent);
          if (diff.length > 0 && diff.length <= 20) {
            printDiff(change.relativePath, diff);
          }
        }
      }
      console.log();

      // Confirm
      if (!options.force) {
        const ok = await confirm(t('push.confirm'));
        if (!ok) {
          warn(t('push.cancelled'));
          return;
        }
      }

      // Detect encoding migration: old-encoded filenames to clean up
      const remoteFilenames = Object.keys(gist.files).filter((n) => n !== '_meta.json');
      const migrationDeletes = remoteFilenames.filter((remoteName) => {
        const remotePath = fromGistFilename(remoteName);
        const local = finalFiles.find((f) => f.relativePath === remotePath);
        return local && local.gistFilename !== remoteName;
      });

      // Update
      const deletedFiles = [
        ...changes.filter((c) => c.status === 'deleted').map((c) => c.gistFilename),
        ...migrationDeletes,
      ];

      const filesToUpload = finalFiles.filter((f) =>
        changes.some((c) => c.gistFilename === f.gistFilename && c.status !== 'unchanged'),
      );

      // For encoding migration: also upload files whose encoding changed
      for (const oldName of migrationDeletes) {
        const remotePath = fromGistFilename(oldName);
        const local = finalFiles.find((f) => f.relativePath === remotePath);
        if (local && !filesToUpload.includes(local)) {
          filesToUpload.push(local);
        }
      }

      await updateGist(config.token, config.gist_id, filesToUpload, deletedFiles, encryptedFiles, options.message);
      success(t('push.success'));
    } catch (err) {
      // Gist not found — create new
      if (String(err).includes('404')) {
        info(t('push.gist_not_found_creating'));
        const newGist = await createGist(config.token, finalFiles, encryptedFiles, options.message);
        config.gist_id = newGist.id;
        saveConfig(config);
        success(`${t('push.success')} (${newGist.html_url})`);
      } else {
        throw err;
      }
    }
  } else {
    // No Gist yet — create
    heading(t('push.uploading_new').replace('{count}', String(finalFiles.length)));
    for (const f of finalFiles) {
      console.log(`  [${f.category}] ${f.relativePath}`);
    }
    console.log();

    if (!options.force) {
      const ok = await confirm(t('push.confirm'));
      if (!ok) {
        warn(t('push.cancelled'));
        return;
      }
    }

    info(t('push.creating_gist'));
    const newGist = await createGist(config.token, finalFiles, encryptedFiles, options.message);
    config.gist_id = newGist.id;
    saveConfig(config);
    success(`${t('push.success')} (${newGist.html_url})`);
  }
}
