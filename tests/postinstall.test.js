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

  it('prints nothing to stderr', () => {
    const { stderr } = runScript();
    expect(stderr).toBe('');
  });

  it('prints banner to stdout', () => {
    const { stdout } = runScript();
    expect(stdout).toContain('___ _');
    expect(stdout).toContain('S Y N C');
  });

  it('contains all command sections', () => {
    const { stdout } = runScript();
    expect(stdout).toContain('Getting Started');
    expect(stdout).toContain('Auto Sync');
    expect(stdout).toContain('History & Rollback');
    expect(stdout).toContain('Language');
  });

  it('contains key commands', () => {
    const { stdout } = runScript();
    expect(stdout).toContain('claudesync init');
    expect(stdout).toContain('claudesync push');
    expect(stdout).toContain('claudesync pull');
    expect(stdout).toContain('claudesync auto');
    expect(stdout).toContain('claudesync history');
    expect(stdout).toContain('claudesync --help');
  });

  it('has no ANSI codes when NO_COLOR is set', () => {
    const { stdout } = runScript({ NO_COLOR: '1' });
    expect(stdout).not.toMatch(/\x1b\[/);
  });

  it('has aligned box borders', () => {
    const { stdout } = runScript();
    const lines = stdout.trim().split('\n');
    const boxLines = lines.filter((l) => l.includes('│'));
    const lengths = boxLines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').length);
    const unique = new Set(lengths);
    expect(unique.size).toBe(1);
  });
});
