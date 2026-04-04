import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const script = resolve(import.meta.dirname, '../scripts/postinstall.js');

function runScript(env = {}) {
  const result = spawnSync('node', [script], {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', ...env },
  });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

describe('postinstall banner', () => {
  it('exits with code 0', () => {
    const { status } = runScript();
    expect(status).toBe(0);
  });

  it('prints nothing to stdout', () => {
    const { stdout } = runScript();
    expect(stdout).toBe('');
  });

  it('prints banner to stderr', () => {
    const { stderr } = runScript();
    // Logo is rendered as figlet ASCII art, check for recognizable fragments
    expect(stderr).toContain('___ _');
    expect(stderr).toContain('S Y N C');
  });

  it('contains all command sections', () => {
    const { stderr } = runScript();
    expect(stderr).toContain('Getting Started');
    expect(stderr).toContain('Auto Sync');
    expect(stderr).toContain('History & Rollback');
    expect(stderr).toContain('Language');
  });

  it('contains key commands', () => {
    const { stderr } = runScript();
    expect(stderr).toContain('claudesync init');
    expect(stderr).toContain('claudesync push');
    expect(stderr).toContain('claudesync pull');
    expect(stderr).toContain('claudesync auto');
    expect(stderr).toContain('claudesync history');
    expect(stderr).toContain('claudesync --help');
  });

  it('has no ANSI codes when NO_COLOR is set', () => {
    const { stderr } = runScript({ NO_COLOR: '1' });
    expect(stderr).not.toMatch(/\x1b\[/);
  });

  it('has aligned box borders', () => {
    const { stderr } = runScript();
    const lines = stderr.trim().split('\n');
    const boxLines = lines.filter((l) => l.includes('│'));
    const lengths = boxLines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').length);
    const unique = new Set(lengths);
    expect(unique.size).toBe(1);
  });
});
