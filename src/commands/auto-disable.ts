import { t } from '../utils/i18n.js';
import { success, warn } from '../utils/terminal.js';
import { loadAutoConfig, removeAutoConfig } from '../core/auto-config.js';
import { unregisterScheduler } from '../core/scheduler.js';

export async function runAutoDisable(): Promise<void> {
  const config = loadAutoConfig();
  if (!config) {
    warn(t('auto.not_configured'));
    return;
  }

  // Unregister OS scheduler
  try {
    unregisterScheduler();
  } catch {
    // Best-effort — scheduler might already be gone
  }

  // Remove config
  removeAutoConfig();

  success(t('auto.disabled'));
}
