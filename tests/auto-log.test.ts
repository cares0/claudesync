import { describe, it, expect, afterEach } from 'vitest';
import { appendLog, readRecentLogs } from '../src/core/auto-log.js';
import { autoLogPath } from '../src/utils/paths.js';
import { unlinkSync, existsSync } from 'node:fs';

describe('auto-log', () => {
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
});
