import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { t } from '../utils/i18n.js';
import { info, success, warn, error, heading, confirm, c, printDiff, askHidden } from '../utils/terminal.js';
import { loadConfig, saveConfig } from '../core/auth.js';
import { scanFiles } from '../core/scanner.js';
import { getGist, parseMeta } from '../core/gist.js';
import { compareForPull, simpleDiff } from '../core/conflict.js';
import { decrypt, isEncrypted } from '../core/crypto.js';
import { claudeDir, isPathSafe } from '../utils/paths.js';
import type { PullOptions, FileChange, SyncMeta } from '../types.js';

export async function runPull(options: PullOptions): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }
  if (!config.gist_id) {
    error(t('pull.no_gist'));
    return;
  }

  // 1. Fetch remote
  info(t('pull.fetching'));
  const gist = await getGist(config.token, config.gist_id);

  // 2. Scan local
  const localFiles = scanFiles(options.only);

  // 3. Compare
  const changes = compareForPull(gist, localFiles);
  const modified = changes.filter((c) => c.status !== 'unchanged');

  const meta = parseMeta(gist);
  const toApply = options.only
    ? modified.filter((c) => c.category === options.only)
    : modified;

  if (toApply.length === 0) {
    success(t('pull.no_changes'));
    return;
  }

  // Check if any files need decryption
  const hasEncrypted = toApply.some((c) => {
    const metaEntry = meta?.file_map[c.gistFilename];
    return metaEntry?.encrypted || (c.remoteContent && isEncrypted(c.remoteContent));
  });

  let passphrase: string | undefined;
  if (hasEncrypted) {
    if (config.encrypt_passphrase) {
      passphrase = config.encrypt_passphrase;
    } else {
      const pp = await askHidden(t('encrypt.enter_passphrase'));
      if (!pp.trim()) {
        error(t('encrypt.no_passphrase'));
        return;
      }
      passphrase = pp;
      config.encrypt_passphrase = pp;
      saveConfig(config);
    }
  }

  await applyChanges(toApply, passphrase, options.force ?? false, meta);
}

async function applyChanges(changes: FileChange[], passphrase: string | undefined, force: boolean, meta: SyncMeta | null): Promise<void> {
  heading(t('pull.changes_heading'));
  for (const change of changes) {
    const icon =
      change.status === 'added' ? c.green(t('pull.icon_added')) :
      change.status === 'modified' ? c.yellow(t('pull.icon_modified')) :
      c.red(t('pull.icon_deleted'));
    console.log(`  ${icon} [${change.category}] ${change.relativePath}`);

    if (change.status === 'modified' && change.localContent && change.remoteContent) {
      const diff = simpleDiff(change.localContent, change.remoteContent);
      if (diff.length > 0 && diff.length <= 30) {
        printDiff(change.relativePath, diff);
      } else if (diff.length > 30) {
        console.log(c.dim(`    (${t('pull.diff_truncated').replace('{count}', String(diff.length))})`));
      }
    }
  }
  console.log();

  if (!force) {
    const ok = await confirm(t('pull.confirm'));
    if (!ok) {
      warn(t('pull.cancelled'));
      return;
    }
  }

  // Apply each change
  const base = claudeDir();
  let applied = 0;

  for (const change of changes) {
    if (!isPathSafe(change.relativePath)) {
      error(`${t('error.path_unsafe')} ${change.relativePath}`);
      continue;
    }

    const targetPath = join(base, change.relativePath);

    if (change.status === 'deleted') {
      // Don't delete local files during pull — just skip
      warn(t('pull.skip_deleted').replace('{path}', change.relativePath));
      continue;
    }

    let content = change.remoteContent ?? '';

    // Decrypt if needed — check meta first, fallback to magic prefix
    const metaEntry = meta?.file_map[change.gistFilename];
    const needsDecrypt = metaEntry?.encrypted || isEncrypted(content);
    if (needsDecrypt) {
      if (!passphrase) {
        error(t('pull.decrypt_failed').replace('{path}', change.relativePath));
        continue;
      }
      try {
        content = decrypt(content, passphrase);
      } catch {
        error(t('pull.decrypt_failed').replace('{path}', change.relativePath));
        continue;
      }
    }

    // Backup existing file
    if (existsSync(targetPath)) {
      copyFileSync(targetPath, targetPath + '.bak');
    }

    // Ensure directory exists
    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(targetPath, content, 'utf-8');
    applied++;
  }

  success(`${t('pull.success')} (${t('pull.applied').replace('{count}', String(applied))})`);
}
