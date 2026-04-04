import { t } from '../utils/i18n.js';
import { info, success, error, warn, askHidden } from '../utils/terminal.js';
import { saveConfig, loadConfig, validateToken, deviceFlow } from '../core/auth.js';
import { findGist } from '../core/gist.js';
import { machineName } from '../utils/paths.js';

interface InitOptions {
  useToken?: boolean;
  linkGistId?: string;
}

export async function runInit(options: InitOptions): Promise<void> {
  let token: string;

  if (options.useToken) {
    // Manual PAT input
    token = await askHidden(t('auth.enter_token'));
    if (!token.trim()) {
      error(t('init.no_token_input'));
      return;
    }
    token = token.trim();
  } else if (options.linkGistId) {
    // Link existing Gist — need token first
    const existing = loadConfig();
    if (!existing?.token) {
      error(t('auth.no_token'));
      return;
    }
    token = existing.token;

    saveConfig({
      token,
      gist_id: options.linkGistId,
      machine_name: machineName(),
    });
    success(t('init.gist_linked').replace('{id}', options.linkGistId));
    return;
  } else {
    // OAuth Device Flow
    info(t('auth.device_prompt'));
    try {
      token = await deviceFlow();
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      return;
    }
  }

  // Validate token
  info(t('init.validating'));
  const valid = await validateToken(token);
  if (!valid) {
    error(t('init.token_invalid'));
    return;
  }

  // Check for existing Gist
  info(t('init.searching_gist'));
  const existingGist = await findGist(token);

  const config = {
    token,
    gist_id: existingGist?.id,
    machine_name: machineName(),
  };

  saveConfig(config);
  success(t('auth.token_saved'));

  if (existingGist) {
    success(t('init.gist_found').replace('{id}', existingGist.id));
  } else {
    warn(t('init.no_gist'));
  }
}
