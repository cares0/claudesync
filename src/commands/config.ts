import { t } from '../utils/i18n.js';
import { success, error } from '../utils/terminal.js';
import { saveLangConfig, loadLangConfig } from '../utils/i18n.js';

export function runConfig(args: string[]): void {
  if (args.length === 0 || args[0] === 'list') {
    const lang = loadLangConfig();
    console.log(`  lang: ${lang ?? t('config.not_set')}`);
    return;
  }

  const [key, value] = args;

  if (key === 'lang') {
    if (value !== 'ko' && value !== 'en') {
      error(t('config.invalid_lang'));
      return;
    }
    saveLangConfig(value);
    success(t('config.lang_saved'));
    return;
  }

  error(t('config.unknown_key'));
}
