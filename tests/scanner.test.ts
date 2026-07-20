import { describe, it, expect } from 'vitest';
import { scanFiles, findTargetCategory } from '../src/core/scanner.js';

describe('scanFiles', () => {
  it('returns array of scanned files', () => {
    const files = scanFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it('each file has required properties', () => {
    const files = scanFiles();
    for (const f of files) {
      expect(f).toHaveProperty('absolutePath');
      expect(f).toHaveProperty('relativePath');
      expect(f).toHaveProperty('gistFilename');
      expect(f).toHaveProperty('category');
      expect(f).toHaveProperty('content');
    }
  });

  it('filters by category', () => {
    const settings = scanFiles('settings');
    for (const f of settings) {
      expect(f.category).toBe('settings');
    }
  });

  it('filters by the new agents/rules/commands categories', () => {
    for (const category of ['agents', 'rules', 'commands'] as const) {
      const files = scanFiles(category);
      for (const f of files) {
        expect(f.category).toBe(category);
      }
    }
  });

  it('excludes .DS_Store files', () => {
    const files = scanFiles();
    const dsStore = files.filter((f) => f.relativePath.includes('.DS_Store'));
    expect(dsStore.length).toBe(0);
  });
});

describe('findTargetCategory', () => {
  it('matches flat file targets by exact path', () => {
    expect(findTargetCategory('settings.json')).toBe('settings');
    expect(findTargetCategory('CLAUDE.md')).toBe('instructions');
  });

  it('matches directory targets for the dir itself and nested files', () => {
    expect(findTargetCategory('agents')).toBe('agents');
    expect(findTargetCategory('agents/my-agent.md')).toBe('agents');
    expect(findTargetCategory('rules/my-rule.md')).toBe('rules');
    expect(findTargetCategory('commands/my-command.md')).toBe('commands');
  });

  it('returns undefined for paths that are not a current sync target', () => {
    expect(findTargetCategory('teams/session-abc/foo.json')).toBeUndefined();
    expect(findTargetCategory('plugins/installed_plugins.json')).toBeUndefined();
    expect(findTargetCategory('policy-limits.json')).toBeUndefined();
  });

  it('does not match a file whose name merely starts with a dir target name', () => {
    expect(findTargetCategory('hooksomething.sh')).toBeUndefined();
  });
});
