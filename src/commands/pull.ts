import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { t } from '../utils/i18n.js';
import { info, success, warn, error, heading, confirm, c, printDiff, select } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
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
    error('Gist가 연결되지 않았습니다. `claudesync push` 또는 `claudesync link <id>`를 먼저 실행하세요.');
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
  await applyChanges(toApply, config.token, options.force ?? false, meta);
}

async function applyChanges(changes: FileChange[], token: string, force: boolean, meta: SyncMeta | null): Promise<void> {
  heading('변경사항:');
  for (const change of changes) {
    const icon =
      change.status === 'added' ? c.green('+ 추가') :
      change.status === 'modified' ? c.yellow('~ 수정') :
      c.red('- 삭제');
    console.log(`  ${icon} [${change.category}] ${change.relativePath}`);

    if (change.status === 'modified' && change.localContent && change.remoteContent) {
      const diff = simpleDiff(change.localContent, change.remoteContent);
      if (diff.length > 0 && diff.length <= 30) {
        printDiff(change.relativePath, diff);
      } else if (diff.length > 30) {
        console.log(c.dim(`    (${diff.length}줄 변경 — claudesync diff로 전체 확인)`));
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
      warn(`스킵: ${change.relativePath} (원격에서 삭제됨, 로컬은 유지)`);
      continue;
    }

    let content = change.remoteContent ?? '';

    // Decrypt if needed — check meta first, fallback to magic prefix
    const metaEntry = meta?.file_map[change.gistFilename];
    const needsDecrypt = metaEntry?.encrypted || isEncrypted(content);
    if (needsDecrypt) {
      try {
        content = decrypt(content, token);
      } catch {
        error(`복호화 실패: ${change.relativePath}`);
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

  success(`${t('pull.success')} (${applied}개 파일 적용)`);
}
