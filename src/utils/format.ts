import { t } from './i18n.js';

/** Format seconds into human-readable interval with i18n support */
export function formatInterval(seconds: number): string {
  if (seconds < 60) return t('auto.interval_seconds').replace('{n}', String(seconds));
  if (seconds < 3600) return t('auto.interval_minutes').replace('{n}', String(Math.round(seconds / 60)));
  if (seconds < 86400) return t('auto.interval_hours').replace('{n}', String(Math.round(seconds / 3600)));
  return t('auto.interval_days').replace('{n}', String(Math.round(seconds / 86400)));
}
