import { t } from '../utils/i18n.js';
import { error, heading, c, info } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
import { getHistory, getGistAtRevision, parseMeta } from '../core/gist.js';

const MAX_REVISIONS = 10;

export async function runHistory(): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }
  if (!config.gist_id) {
    error('Gist가 연결되지 않았습니다.');
    return;
  }

  const allRevisions = await getHistory(config.token, config.gist_id);

  if (allRevisions.length === 0) {
    console.log(t('history.empty'));
    return;
  }

  const revisions = allRevisions.slice(0, MAX_REVISIONS);
  info(`최근 ${revisions.length}개 리비전의 메시지를 불러오는 중...`);

  // Fetch _meta.json from each revision to get the message
  const messages = await Promise.all(
    revisions.map(async (rev) => {
      try {
        const gist = await getGistAtRevision(config.token, config.gist_id!, rev.version);
        const meta = parseMeta(gist);
        return meta?.last_sync.message ?? null;
      } catch {
        return null;
      }
    }),
  );

  heading(t('history.title'));
  for (let i = 0; i < revisions.length; i++) {
    const rev = revisions[i];
    const date = new Date(rev.committed_at).toLocaleString();
    const shortSha = rev.version.slice(0, 8);
    const stats = `+${rev.change_status.additions} -${rev.change_status.deletions}`;
    const msg = messages[i];

    const prefix = i === 0 ? c.green('●') : c.dim('○');
    const msgStr = msg ? ` ${c.cyan(msg)}` : '';
    console.log(`  ${prefix} ${c.bold(shortSha)} ${c.dim(date)} ${c.yellow(stats)}${msgStr}`);
  }

  if (allRevisions.length > MAX_REVISIONS) {
    console.log(c.dim(`  ... 외 ${allRevisions.length - MAX_REVISIONS}개`));
  }

  console.log(`\n총 ${allRevisions.length}개 리비전`);
  console.log(c.dim('복원: claudesync rollback <version>'));
}
