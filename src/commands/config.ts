import { t } from '../utils/i18n.js';
import { success, error } from '../utils/terminal.js';
import { saveLangConfig, loadLangConfig } from '../utils/i18n.js';
import { loadConfig, saveConfig } from '../core/auth.js';

export function runConfig(args: string[]): void {
  if (args.length === 0 || args[0] === 'list') {
    const lang = loadLangConfig();
    const authConfig = loadConfig();
    console.log(`  lang: ${lang ?? t('config.not_set')}`);
    console.log(`  passphrase: ${authConfig?.encrypt_passphrase ? t('encrypt.passphrase_status_set') : t('encrypt.passphrase_status_not_set')}`);
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

  if (key === 'passphrase') {
    // If value provided as argument, use it directly
    if (value) {
      const config = loadConfig();
      if (!config) {
        error(t('auth.no_token'));
        return;
      }
      config.encrypt_passphrase = value;
      saveConfig(config);
      success(t('encrypt.passphrase_saved'));
      return;
    }
    // Otherwise, handled by async version
    error('Usage: claudesync config passphrase <value>');
    return;
  }

  error(t('config.unknown_key'));
}
