import { describe, it, expect } from 'vitest';
import { toGistFilename, fromGistFilename, isPathSafe } from '../src/utils/paths.js';

describe('toGistFilename', () => {
  it('converts slashes to double dashes', () => {
    expect(toGistFilename('hooks/pre-tool-use.sh')).toBe('hooks--pre-tool-use.sh');
  });

  it('handles deeply nested paths', () => {
    expect(toGistFilename('skills/my-skill/SKILL.md')).toBe('skills--my-skill--SKILL.md');
  });

  it('passes through flat files unchanged', () => {
    expect(toGistFilename('settings.json')).toBe('settings.json');
  });
});

describe('fromGistFilename', () => {
  it('converts double dashes back to slashes', () => {
    expect(fromGistFilename('hooks--pre-tool-use.sh')).toBe('hooks/pre-tool-use.sh');
  });

  it('roundtrips with toGistFilename', () => {
    const original = 'teams/my-team/config.json';
    expect(fromGistFilename(toGistFilename(original))).toBe(original);
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
