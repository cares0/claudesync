import { describe, it, expect } from 'vitest';
import type { SyncMeta } from '../src/types.js';

describe('SyncMeta primary_device', () => {
  it('SyncMeta can include primary_device', () => {
    const meta: SyncMeta = {
      version: 1,
      tool: 'claudesync',
      last_sync: {
        machine: 'test',
        hostname: 'test-host',
        platform: 'darwin-arm64',
        timestamp: '2026-04-04T00:00:00.000Z',
        file_count: 3,
      },
      file_map: {},
      categories: ['settings'],
      primary_device: {
        machine_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        machine: 'macbook-pro',
        hostname: 'macbook-pro.local',
        platform: 'darwin-arm64',
        registered_at: '2026-04-04T00:00:00.000Z',
      },
    };
    expect(meta.primary_device?.machine).toBe('macbook-pro');
  });
});
