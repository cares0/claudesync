import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appendLog, readRecentLogs } from '../src/core/auto-log.js';
import { autoLogPath } from '../src/utils/paths.js';
import { unlinkSync, existsSync, writeFileSync, readFileSync } from 'node:fs';

describe('auto-log', () => {
  beforeEach(() => {
    const path = autoLogPath();
    if (existsSync(path)) unlinkSync(path);
  });

  afterEach(() => {
    const path = autoLogPath();
    if (existsSync(path)) unlinkSync(path);
  });

  it('appendLog creates log entry', () => {
    appendLog('push', 'success', '3 files synced');
    const logs = readRecentLogs(10);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('[push]');
    expect(logs[0]).toContain('[success]');
    expect(logs[0]).toContain('3 files synced');
  });

  it('readRecentLogs limits output', () => {
    for (let i = 0; i < 20; i++) {
      appendLog('push', 'success', `sync ${i}`);
    }
    const logs = readRecentLogs(5);
    expect(logs).toHaveLength(5);
    expect(logs[4]).toContain('sync 19');
  });

  it('readRecentLogs returns empty array when no log', () => {
    const logs = readRecentLogs(10);
    expect(logs).toEqual([]);
  });

  it('appending over 1100 lines triggers rotation to ~1000', () => {
    const lines = Array.from({ length: 1050 }, (_, i) =>
      `2025-01-01T00:00:00Z [push] [success] line ${i}`,
    ).join('\n') + '\n';
    writeFileSync(autoLogPath(), lines, 'utf-8');

    const extra = Array.from({ length: 60 }, (_, i) =>
      `2025-01-01T00:00:00Z [push] [success] extra ${i}`,
    ).join('\n') + '\n';
    writeFileSync(autoLogPath(), lines + extra, 'utf-8');

    appendLog('push', 'success', 'trigger rotation');

    const content = readFileSync(autoLogPath(), 'utf-8');
    const resultLines = content.split('\n').filter((l) => l.length > 0);
    expect(resultLines.length).toBeLessThanOrEqual(1010);
    expect(resultLines.length).toBeGreaterThan(900);
  });

  it('does not rotate when under threshold', () => {
    for (let i = 0; i < 50; i++) {
      appendLog('pull', 'success', `msg ${i}`);
    }
    const logs = readRecentLogs(100);
    expect(logs).toHaveLength(50);
  });
});
