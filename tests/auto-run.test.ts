import { describe, it, expect } from 'vitest';
import type { PrimaryDevice } from '../src/types.js';

// Lock tests are in lock.test.ts
// Log rotation tests are in auto-log.test.ts
// (Both share real files, so they must not run in parallel with duplicates)

describe('PrimaryDevice type', () => {
  it('requires machine_id field', () => {
    const device: PrimaryDevice = {
      machine_id: 'uuid-1234',
      machine: 'my-laptop',
      hostname: 'my-laptop.local',
      platform: 'darwin-arm64',
      registered_at: '2025-01-01T00:00:00Z',
    };
    expect(device.machine_id).toBe('uuid-1234');
    expect(device.machine).toBe('my-laptop');
  });

  it('PrimaryDevice contains all required fields', () => {
    const device: PrimaryDevice = {
      machine_id: 'abc-123',
      machine: 'workstation',
      hostname: 'ws.local',
      platform: 'linux-x64',
      registered_at: '2025-06-01T00:00:00Z',
    };
    const keys = Object.keys(device);
    expect(keys).toContain('machine_id');
    expect(keys).toContain('machine');
    expect(keys).toContain('hostname');
    expect(keys).toContain('platform');
    expect(keys).toContain('registered_at');
  });
});
