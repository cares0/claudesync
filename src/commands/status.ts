import { t } from '../utils/i18n.js';
import { c, heading } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
import { getGist, parseMeta } from '../core/gist.js';
import { machineName, platformString } from '../utils/paths.js';

export async function runStatus(): Promise<void> {
  const config = loadConfig();

  heading(t('status.title'));

  // Auth
  if (config?.token) {
    console.log(`  ${t('status.auth_label')}: ${c.green(t('status.authenticated'))}`);
  } else {
    console.log(`  ${t('status.auth_label')}: ${c.red(t('status.not_authenticated'))}`);
    return;
  }

  // Gist
  if (config.gist_id) {
    console.log(`  ${t('status.gist_label')}: ${c.green(config.gist_id)}`);

    try {
      const gist = await getGist(config.token, config.gist_id);
      const meta = parseMeta(gist);

      if (meta) {
        console.log(`  ${t('status.last_sync')}`);
        console.log(`    ${t('status.machine')}: ${meta.last_sync.machine}`);
        console.log(`    ${t('status.host')}: ${meta.last_sync.hostname}`);
        console.log(`    ${t('status.platform')}: ${meta.last_sync.platform}`);
        console.log(`    ${t('status.time')}: ${meta.last_sync.timestamp}`);
        console.log(`    ${t('status.file_count')}: ${meta.last_sync.file_count}`);
      }

      const fileCount = Object.keys(gist.files).filter((n) => n !== '_meta.json').length;
      console.log(`  ${t('status.remote_files').replace('{count}', String(fileCount))}`);
    } catch {
      console.log(`  ${c.yellow(t('status.gist_fetch_failed'))}`);
    }
  } else {
    console.log(`  ${t('status.gist_label')}: ${c.yellow(t('status.no_gist'))}`);
  }

  // Local machine info
  console.log(`  ${t('status.current_machine')}: ${machineName()}`);
  console.log(`  ${t('status.platform')}: ${platformString()}`);
}
