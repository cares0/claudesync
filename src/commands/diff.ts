import { t } from '../utils/i18n.js';
import { info, error, c, printDiff } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
import { scanFiles } from '../core/scanner.js';
import { getGist } from '../core/gist.js';
import { compareForPull, simpleDiff } from '../core/conflict.js';
import type { DiffOptions } from '../types.js';

export async function runDiff(options: DiffOptions): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }
  if (!config.gist_id) {
    error('Gist가 연결되지 않았습니다.');
    return;
  }

  info('원격 설정을 가져오는 중...');
  const gist = await getGist(config.token, config.gist_id);
  const localFiles = scanFiles(options.only);
  const changes = compareForPull(gist, localFiles);

  const modified = changes.filter((ch) => ch.status !== 'unchanged');
  if (modified.length === 0) {
    console.log(t('diff.no_diff'));
    return;
  }

  for (const change of modified) {
    const icon =
      change.status === 'added' ? c.green('NEW') :
      change.status === 'modified' ? c.yellow('MOD') :
      c.red('DEL');

    console.log(`\n${icon} [${change.category}] ${change.relativePath}`);

    if (change.status === 'modified' && change.localContent && change.remoteContent) {
      const diff = simpleDiff(change.localContent, change.remoteContent);
      printDiff(change.relativePath, diff);
    } else if (change.status === 'added' && change.remoteContent) {
      const lines = change.remoteContent.split('\n').map((l) => `+${l}`);
      printDiff(change.relativePath, lines);
    }
  }

  console.log(`\n총 ${modified.length}개 파일에 차이가 있습니다.`);
}
