import { t } from '../utils/i18n.js';
import { heading, warn, c } from '../utils/terminal.js';
import { loadAutoConfig } from '../core/auto-config.js';
import { readRecentLogs } from '../core/auto-log.js';
import { loadConfig } from '../core/auth.js';
import { getGist, parseMeta } from '../core/gist.js';
import { getMachineId } from '../utils/paths.js';

function formatInterval(seconds: number): string {
  if (seconds < 60) return t('auto.interval_seconds').replace('{n}', String(seconds));
  if (seconds < 3600) return t('auto.interval_minutes').replace('{n}', String(Math.round(seconds / 60)));
  if (seconds < 86400) return t('auto.interval_hours').replace('{n}', String(Math.round(seconds / 3600)));
  return t('auto.interval_days').replace('{n}', String(Math.round(seconds / 86400)));
}

export async function runAutoStatus(): Promise<void> {
  const autoConfig = loadAutoConfig();

  heading(t('auto.status_title'));

  if (!autoConfig) {
    warn(t('auto.not_configured'));
    return;
  }

  console.log(`  ${c.bold(t('auto.status_label') + ':')}     ${autoConfig.enabled ? c.green(t('auto.status_enabled')) : c.red(t('auto.status_disabled'))}`);
  console.log(`  ${c.bold(t('auto.summary_direction') + ':')}  ${autoConfig.direction}`);
  console.log(`  ${c.bold(t('auto.summary_interval') + ':')}   ${formatInterval(autoConfig.interval_seconds)}`);
  console.log(`  ${c.bold(t('auto.summary_categories') + ':')} ${autoConfig.categories.join(', ')}`);
  console.log(`  ${c.bold(t('auto.summary_encrypt') + ':')}    ${autoConfig.encrypt ? t('auto.yes') : t('auto.no')}`);
  if (autoConfig.conflict_policy) {
    console.log(`  ${c.bold(t('auto.summary_conflict') + ':')}   ${autoConfig.conflict_policy}`);
  }
  console.log(`  ${c.bold(t('auto.created_label') + ':')}    ${autoConfig.created_at}`);

  // Show primary device info from Gist
  const authConfig = loadConfig();
  if (authConfig?.token && authConfig.gist_id) {
    try {
      const gist = await getGist(authConfig.token, authConfig.gist_id);
      const meta = parseMeta(gist);
      if (meta?.primary_device) {
        const pd = meta.primary_device;
        const isMe = pd.machine_id === getMachineId();
        console.log();
        console.log(`  ${c.bold(t('auto.primary_device_label') + ':')}`);
        console.log(`    ${t('status.machine')}:  ${pd.machine} ${isMe ? c.green(t('auto.this_machine')) : ''}`);
        console.log(`    Hostname: ${pd.hostname}`);
        console.log(`    ${t('status.platform')}: ${pd.platform}`);
        console.log(`    ${t('auto.since_label')}:    ${pd.registered_at}`);
      }
    } catch {
      // Can't fetch — skip
    }
  }

  // Show recent logs
  const logs = readRecentLogs(5);
  if (logs.length > 0) {
    console.log();
    console.log(`  ${c.bold(t('auto.recent_logs_label') + ':')}`);
    for (const log of logs) {
      const colored = log
        .replace(/\[success\]/g, c.green('[success]'))
        .replace(/\[error\]/g, c.red('[error]'))
        .replace(/\[skipped\]/g, c.yellow('[skipped]'));
      console.log(`    ${colored}`);
    }
  }
}
