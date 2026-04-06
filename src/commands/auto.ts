import { t } from '../utils/i18n.js';
import { success, warn, error, heading, confirm, ask, select, c, askHidden } from '../utils/terminal.js';
import { loadConfig, saveConfig } from '../core/auth.js';
import { formatInterval } from '../utils/format.js';
import { getGist, parseMeta } from '../core/gist.js';
import { saveAutoConfig } from '../core/auto-config.js';
import { registerScheduler, unregisterScheduler } from '../core/scheduler.js';
import { machineName, platformString, getMachineId } from '../utils/paths.js';
import { CATEGORIES } from '../types.js';
import type { AutoConfig, AutoDirection, PullConflictPolicy, Category, PrimaryDevice } from '../types.js';
import { hostname } from 'node:os';

const MIN_INTERVAL_SECONDS = 60;

function parseInterval(input: string): number | null {
  const match = input.trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return null;
  }
}

export async function runAuto(): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }
  if (!config.gist_id) {
    error(t('auto.no_gist'));
    return;
  }

  heading(t('auto.title'));

  // 1. Direction
  const dirIdx = await select(t('auto.select_direction'), [
    t('auto.direction_push'),
    t('auto.direction_pull'),
  ]);
  const direction: AutoDirection = dirIdx === 0 ? 'push' : 'pull';

  // 2. Push-specific: check primary device
  let primaryDevice: PrimaryDevice | undefined;
  if (direction === 'push') {
    try {
      const gist = await getGist(config.token, config.gist_id);
      const meta = parseMeta(gist);
      if (meta?.primary_device) {
        const current = meta.primary_device;
        const isMe = current.machine_id === getMachineId();
        if (!isMe) {
          console.log();
          warn(
            t('auto.primary_warning')
              .replace('{machine}', current.machine)
              .replace('{hostname}', current.hostname),
          );
          const ok = await confirm(t('auto.confirm_primary_change'), false);
          if (!ok) {
            warn(t('auto.setup_cancelled'));
            return;
          }
        }
      }
    } catch {
      // Can't fetch gist — proceed anyway
    }

    primaryDevice = {
      machine_id: getMachineId(),
      machine: machineName(),
      hostname: hostname(),
      platform: platformString(),
      registered_at: new Date().toISOString(),
    };
  }

  // 3. Pull-specific: conflict policy
  let conflictPolicy: PullConflictPolicy | undefined;
  if (direction === 'pull') {
    const policyIdx = await select(t('auto.select_conflict_policy'), [
      t('auto.policy_overwrite'),
      t('auto.policy_skip'),
      t('auto.policy_backup'),
    ]);
    conflictPolicy = (['overwrite', 'skip', 'backup'] as const)[policyIdx];
  }

  // 4. Interval
  let intervalSeconds: number | null = null;
  while (intervalSeconds === null) {
    const input = await ask(t('auto.select_interval') + ' ');
    intervalSeconds = parseInterval(input);
    if (intervalSeconds === null) {
      warn(t('auto.interval_invalid'));
      continue;
    }
    if (intervalSeconds < MIN_INTERVAL_SECONDS) {
      warn(t('auto.interval_too_short'));
      intervalSeconds = null;
    }
  }

  // 5. Categories
  console.log();
  const allCats = [...CATEGORIES];
  console.log(`${t('auto.select_categories')}`);
  console.log(`  ${c.dim(allCats.join(', '))}`);
  const catInput = await ask('> ');
  let selectedCategories: Category[] = catInput.trim()
    ? catInput.split(',').map((s) => s.trim()).filter((s) => allCats.includes(s as Category)) as Category[]
    : [...allCats];

  if (catInput.trim() && selectedCategories.length === 0) {
    warn(t('auto.invalid_categories'));
    selectedCategories = [...allCats];
  }

  // 6. Encryption
  const encrypt = await confirm(t('auto.select_encrypt'), false);

  // 6b. If encryption enabled, ensure passphrase is stored
  if (encrypt && !config.encrypt_passphrase) {
    const pp = await askHidden(t('encrypt.enter_passphrase'));
    if (!pp.trim()) {
      warn(t('auto.setup_cancelled'));
      return;
    }
    const pp2 = await askHidden(t('encrypt.confirm_passphrase'));
    if (pp !== pp2) {
      error(t('encrypt.mismatch'));
      return;
    }
    config.encrypt_passphrase = pp;
    saveConfig(config);
    success(t('encrypt.passphrase_saved'));
  }

  // 7. Save config
  const autoConfig: AutoConfig = {
    direction,
    interval_seconds: intervalSeconds,
    categories: selectedCategories,
    encrypt,
    enabled: true,
    created_at: new Date().toISOString(),
    ...(conflictPolicy && { conflict_policy: conflictPolicy }),
  };
  saveAutoConfig(autoConfig);

  // 8. Register OS scheduler
  try {
    unregisterScheduler(); // Clean up any existing
    registerScheduler(intervalSeconds);
  } catch (err) {
    error(t('auto.scheduler_failed').replace('{error}', err instanceof Error ? err.message : String(err)));
    return;
  }

  // 9. Update primary device in Gist (push only)
  if (direction === 'push' && primaryDevice) {
    try {
      const { scanFiles } = await import('../core/scanner.js');
      const files = scanFiles();
      const { updateGist: updateGistFn } = await import('../core/gist.js');
      await updateGistFn(config.token, config.gist_id, files, undefined, undefined, 'auto-sync: primary device registered', primaryDevice);
    } catch {
      warn(t('auto.primary_register_failed'));
    }
  }

  // 10. Summary
  console.log();
  success(t('auto.enabled'));
  console.log(`  ${c.bold(t('auto.summary_direction') + ':')} ${direction}`);
  console.log(`  ${c.bold(t('auto.summary_interval') + ':')}  ${formatInterval(intervalSeconds)}`);
  console.log(`  ${c.bold(t('auto.summary_categories') + ':')} ${selectedCategories.join(', ')}`);
  console.log(`  ${c.bold(t('auto.summary_encrypt') + ':')}  ${encrypt ? t('auto.yes') : t('auto.no')}`);
  if (conflictPolicy) {
    console.log(`  ${c.bold(t('auto.summary_conflict') + ':')}  ${conflictPolicy}`);
  }
}
