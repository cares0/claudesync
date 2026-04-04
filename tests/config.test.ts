import { describe, it, expect } from 'vitest';
import { userConfigPath } from '../src/utils/paths.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

describe('userConfigPath', () => {
  it('returns correct path', () => {
    expect(userConfigPath()).toBe(join(homedir(), '.claudesync', 'config.json'));
  });
});
