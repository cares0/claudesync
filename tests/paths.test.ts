import { describe, it, expect } from 'vitest';
import { toGistFilename, fromGistFilename, isPathSafe, autoConfigPath, autoLogPath, lockFilePath, pendingNotificationsPath } from '../src/utils/paths.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

describe('toGistFilename', () => {
  it('converts slashes to %2F', () => {
    expect(toGistFilename('hooks/pre-tool-use.sh')).toBe('hooks%2Fpre-tool-use.sh');
  });

  it('handles deeply nested paths', () => {
    expect(toGistFilename('skills/my-skill/SKILL.md')).toBe('skills%2Fmy-skill%2FSKILL.md');
  });

  it('passes through flat files unchanged', () => {
    expect(toGistFilename('settings.json')).toBe('settings.json');
  });

  it('preserves double dashes in filenames', () => {
    expect(toGistFilename('hooks/my--script.sh')).toBe('hooks%2Fmy--script.sh');
  });
});

describe('fromGistFilename', () => {
  it('converts %2F back to slashes (new encoding)', () => {
    expect(fromGistFilename('hooks%2Fpre-tool-use.sh')).toBe('hooks/pre-tool-use.sh');
  });

  it('converts -- back to slashes (legacy encoding)', () => {
    expect(fromGistFilename('hooks--pre-tool-use.sh')).toBe('hooks/pre-tool-use.sh');
  });

  it('roundtrips with toGistFilename', () => {
    const original = 'teams/my-team/config.json';
    expect(fromGistFilename(toGistFilename(original))).toBe(original);
  });

  it('preserves double dashes when %2F is present', () => {
    expect(fromGistFilename('hooks%2Fmy--script.sh')).toBe('hooks/my--script.sh');
  });
});

describe('isPathSafe', () => {
  it('allows normal relative paths', () => {
    expect(isPathSafe('settings.json')).toBe(true);
    expect(isPathSafe('hooks/pre-tool-use.sh')).toBe(true);
  });

  it('rejects path traversal', () => {
    expect(isPathSafe('../../../etc/passwd')).toBe(false);
    expect(isPathSafe('../../.ssh/id_rsa')).toBe(false);
  });

  it('rejects absolute paths', () => {
    expect(isPathSafe('/etc/passwd')).toBe(false);
  });
});

describe('auto sync paths', () => {
  it('autoConfigPath returns correct path', () => {
    expect(autoConfigPath()).toBe(join(homedir(), '.claudesync', 'auto.json'));
  });

  it('autoLogPath returns correct path', () => {
    expect(autoLogPath()).toBe(join(homedir(), '.claudesync', 'auto.log'));
  });

  it('lockFilePath returns correct path', () => {
    expect(lockFilePath()).toBe(join(homedir(), '.claudesync', 'sync.lock'));
  });

  it('pendingNotificationsPath returns correct path', () => {
    expect(pendingNotificationsPath()).toBe(join(homedir(), '.claudesync', 'notifications.json'));
  });
});
