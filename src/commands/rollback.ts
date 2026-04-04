import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { t } from '../utils/i18n.js';
import { info, success, warn, error, heading, confirm, c, printDiff } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
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
    error('Gist가 연결되지 않았습니다.');
    return;
  }

  // Resolve short SHA to full SHA
  const revisions = await getHistory(config.token, config.gist_id);
  const matched = revisions.find((r) => r.version.startsWith(version));
  if (!matched) {
    error(`리비전 '${version}'을 찾을 수 없습니다. \`claudesync history\`로 확인하세요.`);
    return;
  }

  const fullSha = matched.version;
  info(`리비전 ${fullSha.slice(0, 8)} (${new Date(matched.committed_at).toLocaleString()})을 복원합니다.`);

  // Fetch Gist at that revision
  const gist = await getGistAtRevision(config.token, config.gist_id, fullSha);
  const meta = parseMeta(gist);
  const localFiles = scanFiles();
  const localMap = new Map(localFiles.map((f) => [f.gistFilename, f]));
  const base = claudeDir();

  // Show diff
  const filesToApply: Array<{ relativePath: string; content: string }> = [];

  heading('복원 대상:');
  for (const [gistName, gistFile] of Object.entries(gist.files)) {
    if (gistName === META_FILE || !gistFile?.content) continue;

    const entry = meta?.file_map[gistName];
    const relativePath = entry?.path ?? fromGistFilename(gistName);
    const local = localMap.get(gistName);

    if (!local) {
      console.log(`  ${c.green('+')} ${relativePath} (새 파일)`);
    } else if (local.content !== gistFile.content) {
      console.log(`  ${c.yellow('~')} ${relativePath}`);
      const diff = simpleDiff(local.content, gistFile.content);
      if (diff.length <= 20) {
        printDiff(relativePath, diff);
      }
    } else {
      continue; // unchanged
    }

    let content = gistFile.content;
    const needsDecrypt = entry?.encrypted || isEncrypted(content);
    if (needsDecrypt) {
      try {
        content = decrypt(content, config.token);
      } catch {
        error(`복호화 실패: ${relativePath}`);
        continue;
      }
    }
    filesToApply.push({ relativePath, content });
  }

  if (filesToApply.length === 0) {
    success('현재 상태와 동일합니다.');
    return;
  }

  console.log(`\n${filesToApply.length}개 파일이 변경됩니다.`);

  const ok = await confirm('복원하시겠습니까?');
  if (!ok) {
    warn('복원이 취소되었습니다.');
    return;
  }

  // Apply
  for (const { relativePath, content } of filesToApply) {
    if (!isPathSafe(relativePath)) {
      error(`${t('error.path_unsafe')} ${relativePath}`);
      continue;
    }

    const targetPath = join(base, relativePath);
    if (existsSync(targetPath)) {
      copyFileSync(targetPath, targetPath + '.bak');
    }
    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(targetPath, content, 'utf-8');
  }

  success(`리비전 ${fullSha.slice(0, 8)}로 복원 완료!`);
}
