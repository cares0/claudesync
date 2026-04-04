import { setLang, detectLang, t, loadLangConfig } from './utils/i18n.js';
import { error, info, warn } from './utils/terminal.js';

import { runInit } from './commands/init.js';
import { runPush } from './commands/push.js';
import { runPull } from './commands/pull.js';
import { runDiff } from './commands/diff.js';
import { runStatus } from './commands/status.js';
import { runHistory } from './commands/history.js';
import { runRollback } from './commands/rollback.js';
import { runAuto } from './commands/auto.js';
import { runAutoRun } from './commands/auto-run.js';
import { runAutoDisable } from './commands/auto-disable.js';
import { runAutoStatus } from './commands/auto-status.js';
import { getPendingNotifications, clearPendingNotifications } from './core/notify.js';
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

${t('help.usage')}

${t('help.commands')}
  init                 ${t('help.init')}
  init --token         ${t('help.init_token')}
  link <gist-id>       ${t('help.link')}
  push                 ${t('help.push')}
  pull                 ${t('help.pull')}
  diff                 ${t('help.diff')}
  status               ${t('help.status')}
  list                 ${t('help.list')}
  history              ${t('help.history')}
  rollback <version>   ${t('help.rollback')}
  auto                 ${t('help.auto')}
  auto disable         ${t('help.auto_disable')}
  auto status          ${t('help.auto_status')}
  config <key> <value> ${t('help.config')}

${t('help.options')}
  -m, --message <msg>  ${t('help.opt_message')}
  --only <category>    ${t('help.opt_only')}
  --force              ${t('help.opt_force')}
  --encrypt            ${t('help.opt_encrypt')}
  --lang=ko|en         ${t('help.opt_lang')}
  -h, --help           ${t('help.opt_help')}
  -v, --version        ${t('help.opt_version')}
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

  // Language: --lang flag > config.json > env detection > en default
  const langFlag = flags['lang'];
  if (langFlag === 'ko' || langFlag === 'en') {
    setLang(langFlag);
  } else {
    const saved = loadLangConfig();
    setLang(saved ?? detectLang());
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
    // Show pending notifications from auto sync
    if (command !== 'auto-run') {
      const notifications = getPendingNotifications();
      if (notifications.length > 0) {
        for (const n of notifications) {
          if (n.level === 'error') error(n.message);
          else if (n.level === 'warning') warn(n.message);
          else info(n.message);
        }
        clearPendingNotifications();
        console.log();
      }
    }
    switch (command) {
      case 'init':
        await runInit({ useToken: !!flags['token'] });
        break;
      case 'link':
        if (!positional[0]) {
          error(t('cli.link_usage'));
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
          console.log(t('cli.list_empty'));
        } else {
          for (const f of files) {
            console.log(`  [${f.category}] ${f.relativePath}`);
          }
          console.log(`\n${t('cli.list_total').replace('{count}', String(files.length))}`);
        }
        break;
      }
      case 'history':
        await runHistory();
        break;
      case 'rollback':
        if (!positional[0]) {
          error(t('cli.rollback_usage'));
          process.exit(1);
        }
        await runRollback(positional[0]);
        break;
      case 'auto':
        if (positional[0] === 'disable') {
          await runAutoDisable();
        } else if (positional[0] === 'status') {
          await runAutoStatus();
        } else {
          await runAuto();
        }
        break;
      case 'config': {
        const { runConfig } = await import('./commands/config.js');
        runConfig(positional);
        break;
      }
      case 'auto-run':
        await runAutoRun();
        break;
      default:
        error(t('cli.unknown_command').replace('{command}', command));
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
