import { t } from '../utils/i18n.js';
import { heading, warn, c } from '../utils/terminal.js';
import { loadAutoConfig } from '../core/auto-config.js';
import { readRecentLogs } from '../core/auto-log.js';
import { loadConfig } from '../core/auth.js';
import { getGist, parseMeta } from '../core/gist.js';
import { machineName } from '../utils/paths.js';

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}분`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}시간`;
  return `${Math.round(seconds / 86400)}일`;
}

export async function runAutoStatus(): Promise<void> {
  const autoConfig = loadAutoConfig();

  heading(t('auto.status_title'));

  if (!autoConfig) {
    warn(t('auto.not_configured'));
    return;
  }

  console.log(`  ${c.bold('Status:')}     ${autoConfig.enabled ? c.green('Enabled') : c.red('Disabled')}`);
  console.log(`  ${c.bold('Direction:')}  ${autoConfig.direction}`);
  console.log(`  ${c.bold('Interval:')}   ${formatInterval(autoConfig.interval_seconds)}`);
  console.log(`  ${c.bold('Categories:')} ${autoConfig.categories.join(', ')}`);
  console.log(`  ${c.bold('Encrypt:')}    ${autoConfig.encrypt ? 'Yes' : 'No'}`);
  if (autoConfig.conflict_policy) {
    console.log(`  ${c.bold('Conflict:')}   ${autoConfig.conflict_policy}`);
  }
  console.log(`  ${c.bold('Created:')}    ${autoConfig.created_at}`);

  // Show primary device info from Gist
  const authConfig = loadConfig();
  if (authConfig?.token && authConfig.gist_id) {
    try {
      const gist = await getGist(authConfig.token, authConfig.gist_id);
      const meta = parseMeta(gist);
      if (meta?.primary_device) {
        const pd = meta.primary_device;
        const isMe = pd.machine === machineName();
        console.log();
        console.log(`  ${c.bold('Primary Device:')}`);
        console.log(`    Machine:  ${pd.machine} ${isMe ? c.green('(this machine)') : ''}`);
        console.log(`    Hostname: ${pd.hostname}`);
        console.log(`    Platform: ${pd.platform}`);
        console.log(`    Since:    ${pd.registered_at}`);
      }
    } catch {
      // Can't fetch — skip
    }
  }

  // Show recent logs
  const logs = readRecentLogs(5);
  if (logs.length > 0) {
    console.log();
    console.log(`  ${c.bold('Recent Logs:')}`);
    for (const log of logs) {
      const colored = log
        .replace(/\[success\]/g, c.green('[success]'))
        .replace(/\[error\]/g, c.red('[error]'))
        .replace(/\[skipped\]/g, c.yellow('[skipped]'));
      console.log(`    ${colored}`);
    }
  }
}
