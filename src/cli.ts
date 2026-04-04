import { setLang, detectLang, t } from './utils/i18n.js';
import { error } from './utils/terminal.js';

import { runInit } from './commands/init.js';
import { runPush } from './commands/push.js';
import { runPull } from './commands/pull.js';
import { runDiff } from './commands/diff.js';
import { runStatus } from './commands/status.js';
import { runHistory } from './commands/history.js';
import { runRollback } from './commands/rollback.js';
import type { Category } from './types.js';
import { CATEGORIES } from './types.js';

const VERSION = '0.1.0';

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let command: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[arg.slice(2)] = args[i + 1];
        i++;
      } else {
        flags[arg.slice(2)] = true;
      }
    } else if (arg.startsWith('-')) {
      flags[arg.slice(1)] = true;
    } else {
      if (!command) {
        command = arg;
      } else {
        positional.push(arg);
      }
    }
  }

  return { command, flags, positional };
}

function printHelp(): void {
  console.log(`
${t('app.name')} v${VERSION}
${t('app.description')}

Usage: claudesync <command> [options]

Commands:
  init                 인증 설정 (OAuth Device Flow)
  init --token         PAT 수동 입력
  link <gist-id>       기존 Gist 연결
  push                 로컬 → Gist 업로드
  pull                 Gist → 로컬 복원
  diff                 로컬 vs 원격 비교
  status               인증/동기화 상태 확인
  list                 동기화 대상 로컬 파일 목록
  history              Gist revision 히스토리
  rollback <version>   특정 버전으로 복원

Options:
  -m, --message <msg>  push 시 메시지 기록 (history에서 표시)
  --only <category>    카테고리 필터 (settings|instructions|hooks|skills|plugins|teams|ui)
  --force              확인 없이 실행
  --encrypt            암호화 활성화
  --lang=ko|en         언어 설정
  -h, --help           도움말
  -v, --version        버전 정보
`);
}

function parseCategory(value: string | boolean | undefined): Category | undefined {
  if (typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)) {
    return value as Category;
  }
  return undefined;
}

async function main() {
  const { command, flags, positional } = parseArgs(process.argv);

  // Language
  const langFlag = flags['lang'];
  if (langFlag === 'ko' || langFlag === 'en') {
    setLang(langFlag);
  } else {
    setLang(detectLang());
  }

  // Version
  if (flags['v'] || flags['version']) {
    console.log(VERSION);
    return;
  }

  // Help
  if (!command || flags['h'] || flags['help']) {
    printHelp();
    return;
  }

  const only = parseCategory(flags['only']);
  const force = !!flags['force'];
  const encrypt = !!flags['encrypt'];
  const message = typeof flags['m'] === 'string' ? flags['m'] :
                  typeof flags['message'] === 'string' ? flags['message'] : undefined;

  try {
    switch (command) {
      case 'init':
        await runInit({ useToken: !!flags['token'] });
        break;
      case 'link':
        if (!positional[0]) {
          error('Usage: claudesync link <gist-id>');
          process.exit(1);
        }
        await runInit({ linkGistId: positional[0] });
        break;
      case 'push':
        await runPush({ only, force, encrypt, message });
        break;
      case 'pull':
        await runPull({ only, force });
        break;
      case 'diff':
        await runDiff({ only });
        break;
      case 'status':
        await runStatus();
        break;
      case 'list': {
        const { scanFiles } = await import('./core/scanner.js');
        const files = scanFiles(only);
        if (files.length === 0) {
          console.log('동기화 대상 파일 없음');
        } else {
          for (const f of files) {
            console.log(`  [${f.category}] ${f.relativePath}`);
          }
          console.log(`\n총 ${files.length}개 파일`);
        }
        break;
      }
      case 'history':
        await runHistory();
        break;
      case 'rollback':
        if (!positional[0]) {
          error('Usage: claudesync rollback <version>');
          process.exit(1);
        }
        await runRollback(positional[0]);
        break;
      default:
        error(`알 수 없는 명령어: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
