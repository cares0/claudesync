import { t } from '../utils/i18n.js';
import { c, heading } from '../utils/terminal.js';
import { loadConfig } from '../core/auth.js';
import { getGist, parseMeta } from '../core/gist.js';
import { machineName, platformString } from '../utils/paths.js';

export async function runStatus(): Promise<void> {
  const config = loadConfig();

  heading('claudesync 상태');

  // Auth
  if (config?.token) {
    console.log(`  인증: ${c.green(t('status.authenticated'))}`);
  } else {
    console.log(`  인증: ${c.red(t('status.not_authenticated'))}`);
    return;
  }

  // Gist
  if (config.gist_id) {
    console.log(`  Gist: ${c.green(config.gist_id)}`);

    try {
      const gist = await getGist(config.token, config.gist_id);
      const meta = parseMeta(gist);

      if (meta) {
        console.log(`  마지막 동기화:`);
        console.log(`    머신: ${meta.last_sync.machine}`);
        console.log(`    호스트: ${meta.last_sync.hostname}`);
        console.log(`    플랫폼: ${meta.last_sync.platform}`);
        console.log(`    시간: ${meta.last_sync.timestamp}`);
        console.log(`    파일 수: ${meta.last_sync.file_count}`);
      }

      const fileCount = Object.keys(gist.files).filter((n) => n !== '_meta.json').length;
      console.log(`  원격 파일: ${fileCount}개`);
    } catch {
      console.log(`  ${c.yellow('Gist 조회 실패 — 네트워크를 확인하세요')}`);
    }
  } else {
    console.log(`  Gist: ${c.yellow(t('status.no_gist'))}`);
  }

  // Local machine info
  console.log(`  현재 머신: ${machineName()}`);
  console.log(`  플랫폼: ${platformString()}`);
}
