#!/usr/bin/env node

// ── Color support ───────────────────────────────────
const noColor =
  process.env.NO_COLOR !== undefined ||
  process.env.CI !== undefined ||
  !process.stdout.isTTY;

const esc = (code) => (noColor ? '' : `\x1b[${code}m`);
const reset = noColor ? '' : '\x1b[0m';

const c = {
  bold: (s) => `${esc('1')}${s}${reset}`,
  dim: (s) => `${esc('2')}${s}${reset}`,
  cyan: (s) => `${esc('36')}${s}${reset}`,
  green: (s) => `${esc('32')}${s}${reset}`,
};

// ── Layout helpers ──────────────────────────────────
const W = 50;

function pad(left, content, right) {
  const visibleContent = content.replace(/\x1b\[[0-9;]*m/g, '');
  const visibleRight = right.replace(/\x1b\[[0-9;]*m/g, '');
  const totalText = left + visibleContent + visibleRight;
  const gap = W - totalText.length;
  return left + content + right + ' '.repeat(Math.max(0, gap));
}

function center(text) {
  const visible = text.replace(/\x1b\[[0-9;]*m/g, '');
  const left = Math.floor((W - visible.length) / 2);
  const right = W - visible.length - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

const top = c.dim(`╭${'─'.repeat(W)}╮`);
const mid = c.dim(`├${'─'.repeat(W)}┤`);
const bot = c.dim(`╰${'─'.repeat(W)}╯`);
const row = (s) => `${c.dim('│')}${s}${c.dim('│')}`;
const blank = row(' '.repeat(W));

// ── Logo (figlet "small" font) ──────────────────────
const logo = [
  '  ___ _      _   _   _ ___  ___  ',
  ' / __| |    /_\\ | | | |   \\| __| ',
  '| (__| |__ / _ \\| |_| | |) | _|  ',
  ' \\___|____/_/ \\_\\\\___/|___/|___| ',
];

const logoLines = logo.map((l) => row(center(c.cyan(l))));

const header = [
  top,
  blank,
  ...logoLines,
  row(center(c.cyan(c.bold('S Y N C')))),
  blank,
  row(center('Sync your Claude Code settings across')),
  row(center('machines — powered by GitHub Gist')),
  blank,
];

// ── Command sections ────────────────────────────────
function cmdLine(cmd, desc) {
  return row(pad('    ', c.green(`$ ${cmd}`), `  ${c.dim(desc)}`));
}

function sectionTitle(title) {
  return row(pad('  ', c.bold(`▸ ${title}`), ''));
}

const body = [
  mid,
  blank,
  sectionTitle('Getting Started'),
  cmdLine('claudesync init         ', 'Authenticate'),
  cmdLine('claudesync push         ', 'Upload settings'),
  cmdLine('claudesync pull         ', 'Download settings'),
  blank,
  sectionTitle('Auto Sync'),
  cmdLine('claudesync auto         ', 'Interactive setup'),
  cmdLine('claudesync auto status  ', 'Check status'),
  cmdLine('claudesync auto disable ', 'Stop auto-sync'),
  blank,
  sectionTitle('History & Rollback'),
  cmdLine('claudesync history      ', 'View revisions'),
  cmdLine('claudesync rollback <v> ', 'Restore revision'),
  blank,
  sectionTitle('Language'),
  row(pad('    ', c.green('$ claudesync config lang ko|en'), '')),
  row(pad('    ', c.dim('(defaults to system language)'), '')),
  blank,
  row(pad('  ', `${c.green('$ claudesync --help')}          ${c.dim('Full reference')}`, '')),
  blank,
  bot,
];

// ── Print ───────────────────────────────────────────
const banner = [...header, ...body].join('\n');
process.stdout.write('\n' + banner + '\n\n');
