import { describe, it, expect } from 'vitest';
import type { AutoConfig, PullConflictPolicy, AutoDirection } from '../src/types.js';

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
