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
    error(t('history.no_gist'));
    return;
  }

  const allRevisions = await getHistory(config.token, config.gist_id);

  if (allRevisions.length === 0) {
    console.log(t('history.empty'));
    return;
  }

  const revisions = allRevisions.slice(0, MAX_REVISIONS);
  info(t('history.loading').replace('{count}', String(revisions.length)));

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
    console.log(c.dim(`  ${t('history.more').replace('{count}', String(allRevisions.length - MAX_REVISIONS))}`));
  }

  console.log(`\n${t('history.total').replace('{count}', String(allRevisions.length))}`);
  console.log(c.dim(t('history.rollback_hint')));
}
