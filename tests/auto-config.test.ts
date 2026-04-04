import { describe, it, expect, afterEach } from 'vitest';
import type { AutoConfig, PullConflictPolicy, AutoDirection } from '../src/types.js';
import { saveAutoConfig, loadAutoConfig, removeAutoConfig } from '../src/core/auto-config.js';
import { autoConfigPath } from '../src/utils/paths.js';
import { unlinkSync, existsSync } from 'node:fs';

describe('AutoConfig types', () => {
  it('AutoConfig has correct shape', () => {
    const config: AutoConfig = {
      direction: 'push',
      interval_seconds: 300,
      categories: ['settings', 'hooks'],
      encrypt: false,
      enabled: true,
      created_at: '2026-04-04T00:00:00.000Z',
    };
    expect(config.direction).toBe('push');
    expect(config.interval_seconds).toBe(300);
    expect(config.categories).toEqual(['settings', 'hooks']);
  });

  it('PullConflictPolicy allows valid values', () => {
    const policies: PullConflictPolicy[] = ['overwrite', 'skip', 'backup'];
    expect(policies).toHaveLength(3);
  });

  it('AutoConfig pull includes conflict_policy', () => {
    const config: AutoConfig = {
      direction: 'pull',
      interval_seconds: 600,
      categories: ['settings'],
      encrypt: false,
      enabled: true,
      created_at: '2026-04-04T00:00:00.000Z',
      conflict_policy: 'skip',
    };
    expect(config.conflict_policy).toBe('skip');
  });
});

describe('auto-config persistence', () => {
  afterEach(() => {
    const path = autoConfigPath();
    if (existsSync(path)) unlinkSync(path);
  });

  it('saveAutoConfig and loadAutoConfig roundtrip', () => {
    const config: AutoConfig = {
      direction: 'push',
      interval_seconds: 300,
      categories: ['settings', 'hooks'],
      encrypt: false,
      enabled: true,
      created_at: '2026-04-04T00:00:00.000Z',
    };
    saveAutoConfig(config);
    const loaded = loadAutoConfig();
    expect(loaded).toEqual(config);
  });

  it('loadAutoConfig returns null when no file', () => {
    const loaded = loadAutoConfig();
    expect(loaded).toBeNull();
  });

  it('removeAutoConfig deletes the file', () => {
    const config: AutoConfig = {
      direction: 'pull',
      interval_seconds: 600,
      categories: ['settings'],
      encrypt: false,
      enabled: true,
      created_at: '2026-04-04T00:00:00.000Z',
      conflict_policy: 'skip',
    };
    saveAutoConfig(config);
    removeAutoConfig();
    expect(loadAutoConfig()).toBeNull();
  });
});
