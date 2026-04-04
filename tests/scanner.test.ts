import { describe, it, expect } from 'vitest';
import { scanFiles } from '../src/core/scanner.js';

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

  it('excludes .DS_Store files', () => {
    const files = scanFiles();
    const dsStore = files.filter((f) => f.relativePath.includes('.DS_Store'));
    expect(dsStore.length).toBe(0);
  });
});
