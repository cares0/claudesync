import { t } from '../utils/i18n.js';
import { success, warn, error, heading, confirm, ask, select, c } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
import { getGist, parseMeta } from '../core/gist.js';
import { saveAutoConfig } from '../core/auto-config.js';
import { registerScheduler, unregisterScheduler } from '../core/scheduler.js';
import { machineName, platformString } from '../utils/paths.js';
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

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60}m`;
  if (seconds < 86400) return `${seconds / 3600}h`;
  return `${seconds / 86400}d`;
}

export async function runAuto(): Promise<void> {
  const config = loadConfig();
  if (!config?.token) {
    error(t('auth.no_token'));
    return;
  }
  if (!config.gist_id) {
    error('Gist가 연결되지 않았습니다. `claudesync push` 또는 `claudesync link <id>`를 먼저 실행하세요.');
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
        const isMe = current.machine === machineName() && current.hostname === hostname();
        if (!isMe) {
          console.log();
          warn(
            t('auto.primary_warning')
              .replace('{machine}', current.machine)
              .replace('{hostname}', current.hostname),
          );
          const ok = await confirm(t('auto.confirm_primary_change'), false);
          if (!ok) {
            warn('설정이 취소되었습니다.');
            return;
          }
        }
      }
    } catch {
      // Can't fetch gist — proceed anyway
    }

    primaryDevice = {
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
    warn('유효한 카테고리가 없습니다. 전체 카테고리로 설정합니다.');
    selectedCategories = [...allCats];
  }

  // 6. Encryption
  const encrypt = await confirm(t('auto.select_encrypt'), false);

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
    error(`스케줄러 등록 실패: ${err instanceof Error ? err.message : String(err)}`);
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
      warn('Primary 디바이스 정보를 Gist에 등록하지 못했습니다. 다음 auto push 시 등록됩니다.');
    }
  }

  // 10. Summary
  console.log();
  success(t('auto.enabled'));
  console.log(`  ${c.bold('Direction:')} ${direction}`);
  console.log(`  ${c.bold('Interval:')}  ${formatInterval(intervalSeconds)}`);
  console.log(`  ${c.bold('Categories:')} ${selectedCategories.join(', ')}`);
  console.log(`  ${c.bold('Encrypt:')}  ${encrypt ? 'Yes' : 'No'}`);
  if (conflictPolicy) {
    console.log(`  ${c.bold('Conflict:')}  ${conflictPolicy}`);
  }
}
