import { describe, it, expect, afterEach } from 'vitest';
import { acquireLock, releaseLock, isLocked } from '../src/core/lock.js';
import { unlinkSync, existsSync, writeFileSync } from 'node:fs';
import { lockFilePath } from '../src/utils/paths.js';

describe('lock', () => {
  afterEach(() => {
    const path = lockFilePath();
    if (existsSync(path)) unlinkSync(path);
  });

  it('acquireLock creates lock file', () => {
    const acquired = acquireLock();
    expect(acquired).toBe(true);
    expect(existsSync(lockFilePath())).toBe(true);
  });

  it('acquireLock fails if already locked', () => {
    acquireLock();
    const second = acquireLock();
    expect(second).toBe(false);
  });

  it('releaseLock removes lock file', () => {
    acquireLock();
    releaseLock();
    expect(existsSync(lockFilePath())).toBe(false);
  });

  it('isLocked returns correct state', () => {
    expect(isLocked()).toBe(false);
    acquireLock();
    expect(isLocked()).toBe(true);
    releaseLock();
    expect(isLocked()).toBe(false);
  });

  it('acquireLock removes stale lock (older than 5 minutes)', () => {
    acquireLock();
    // Manually set lock timestamp to 6 minutes ago
    const lockData = JSON.stringify({ pid: 99999, timestamp: Date.now() - 6 * 60 * 1000 });
    writeFileSync(lockFilePath(), lockData);

    const acquired = acquireLock();
    expect(acquired).toBe(true);
  });
});
