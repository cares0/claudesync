import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { t } from '../utils/i18n.js';
import { info, success, warn, error, heading, confirm, c, printDiff, askHidden } from '../utils/terminal.js';
import { loadConfig, saveConfig } from '../core/auth.js';
import { getGistAtRevision, parseMeta, getHistory } from '../core/gist.js';
import { scanFiles } from '../core/scanner.js';
import { simpleDiff } from '../core/conflict.js';
import { decrypt, isEncrypted } from '../core/crypto.js';
import { claudeDir, isPathSafe, fromGistFilename } from '../utils/paths.js';

const META_FILE = '_meta.json';

export async function runRollback(version: string): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }
  if (!config.gist_id) {
    error(t('rollback.no_gist'));
    return;
  }

  // Resolve short SHA to full SHA
  const revisions = await getHistory(config.token, config.gist_id);
  const matched = revisions.find((r) => r.version.startsWith(version));
  if (!matched) {
    error(t('rollback.not_found').replace('{version}', version));
    return;
  }

  const fullSha = matched.version;
  info(t('rollback.restoring').replace('{sha}', fullSha.slice(0, 8)).replace('{date}', new Date(matched.committed_at).toLocaleString()));

  // Fetch Gist at that revision
  const gist = await getGistAtRevision(config.token, config.gist_id, fullSha);
  const meta = parseMeta(gist);
  const localFiles = scanFiles();
  const localMap = new Map(localFiles.map((f) => [f.relativePath, f]));
  const base = claudeDir();

  // Show diff
  const filesToApply: Array<{ relativePath: string; content: string; needsDecrypt: boolean }> = [];

  heading(t('rollback.target_heading'));
  for (const [gistName, gistFile] of Object.entries(gist.files)) {
    if (gistName === META_FILE || !gistFile?.content) continue;

    const entry = meta?.file_map[gistName];
    const relativePath = entry?.path ?? fromGistFilename(gistName);
    const local = localMap.get(relativePath);

    if (!local) {
      console.log(`  ${c.green('+')} ${relativePath} ${t('rollback.new_file')}`);
    } else if (local.content !== gistFile.content) {
      console.log(`  ${c.yellow('~')} ${relativePath}`);
      const diff = simpleDiff(local.content, gistFile.content);
      if (diff.length <= 20) {
        printDiff(relativePath, diff);
      }
    } else {
      continue; // unchanged
    }

    filesToApply.push({
      relativePath,
      content: gistFile.content,
      needsDecrypt: !!(entry?.encrypted || isEncrypted(gistFile.content)),
    });
  }

  if (filesToApply.length === 0) {
    success(t('rollback.no_changes'));
    return;
  }

  // If any files need decryption, get passphrase
  const hasEncrypted = filesToApply.some((f) => f.needsDecrypt);
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

  console.log(`\n${t('rollback.files_changed').replace('{count}', String(filesToApply.length))}`);

  const ok = await confirm(t('rollback.confirm'));
  if (!ok) {
    warn(t('rollback.cancelled'));
    return;
  }

  // Apply
  for (const file of filesToApply) {
    if (!isPathSafe(file.relativePath)) {
      error(`${t('error.path_unsafe')} ${file.relativePath}`);
      continue;
    }

    let content = file.content;
    if (file.needsDecrypt) {
      if (!passphrase) {
        error(t('rollback.decrypt_failed').replace('{path}', file.relativePath));
        continue;
      }
      try {
        content = decrypt(content, passphrase);
      } catch {
        error(t('rollback.decrypt_failed').replace('{path}', file.relativePath));
        continue;
      }
    }

    const targetPath = join(base, file.relativePath);
    if (existsSync(targetPath)) {
      copyFileSync(targetPath, targetPath + '.bak');
    }
    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(targetPath, content, 'utf-8');
  }

  success(t('rollback.success').replace('{sha}', fullSha.slice(0, 8)));
}
