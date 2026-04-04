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
      error('토큰이 입력되지 않았습니다.');
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
    success(`Gist ${options.linkGistId}에 연결되었습니다.`);
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
  info('토큰 검증 중...');
  const valid = await validateToken(token);
  if (!valid) {
    error('토큰이 유효하지 않습니다. gist 스코프가 있는지 확인하세요.');
    return;
  }

  // Check for existing Gist
  info('기존 claudesync Gist 검색 중...');
  const existingGist = await findGist(token);

  const config = {
    token,
    gist_id: existingGist?.id,
    machine_name: machineName(),
  };

  saveConfig(config);
  success(t('auth.token_saved'));

  if (existingGist) {
    success(`기존 Gist를 찾았습니다: ${existingGist.id}`);
  } else {
    warn('기존 Gist가 없습니다. `claudesync push`로 새로 생성하세요.');
  }
}
