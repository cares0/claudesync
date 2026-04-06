import { createInterface } from 'node:readline';
import { t } from './i18n.js';

// ── ANSI Colors ─────────────────────────────────────────────
const esc = (code: string) => `\x1b[${code}m`;
const reset = esc('0');

export const c = {
  bold: (s: string) => `${esc('1')}${s}${reset}`,
  dim: (s: string) => `${esc('2')}${s}${reset}`,
  red: (s: string) => `${esc('31')}${s}${reset}`,
  green: (s: string) => `${esc('32')}${s}${reset}`,
  yellow: (s: string) => `${esc('33')}${s}${reset}`,
  blue: (s: string) => `${esc('34')}${s}${reset}`,
  cyan: (s: string) => `${esc('36')}${s}${reset}`,
  gray: (s: string) => `${esc('90')}${s}${reset}`,
};

// ── Output helpers ──────────────────────────────────────────
export function info(msg: string): void {
  console.log(`${c.blue('ℹ')} ${msg}`);
}

export function success(msg: string): void {
  console.log(`${c.green('✔')} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`${c.yellow('⚠')} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${c.red('✖')} ${msg}`);
}

export function heading(msg: string): void {
  console.log(`\n${c.bold(msg)}`);
}

// ── Diff display ────────────────────────────────────────────
export function printDiff(filename: string, lines: string[]): void {
  console.log(`\n${c.bold(filename)}`);
  console.log(c.dim('─'.repeat(60)));
  for (const line of lines) {
    if (line.startsWith('+')) console.log(c.green(line));
    else if (line.startsWith('-')) console.log(c.red(line));
    else if (line.startsWith('@')) console.log(c.cyan(line));
    else console.log(line);
  }
}

// ── Prompts ─────────────────────────────────────────────────
export async function confirm(message: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = await ask(`${message} ${c.dim(hint)} `);
  if (answer.trim() === '') return defaultYes;
  return answer.trim().toLowerCase().startsWith('y');
}

export async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);

    let input = '';
    const onData = (ch: Buffer) => {
      const char = ch.toString('utf8');
      if (char === '\n' || char === '\r') {
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(input);
      } else if (char === '\u0003') {
        // Ctrl+C
        rl.close();
        process.exit(1);
      } else if (char === '\u007f') {
        // Backspace
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };
    stdin.on('data', onData);
  });
}

export async function select(message: string, options: string[]): Promise<number> {
  console.log(`\n${message}`);
  options.forEach((opt, i) => {
    console.log(`  ${c.bold(`${i + 1}.`)} ${opt}`);
  });
  while (true) {
    const answer = await ask(`${c.dim(t('terminal.select_prompt').replace('{max}', String(options.length)))} `);
    const idx = parseInt(answer.trim(), 10) - 1;
    if (idx >= 0 && idx < options.length) return idx;
  }
}
