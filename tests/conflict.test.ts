import { describe, it, expect } from 'vitest';
import { simpleDiff } from '../src/core/conflict.js';

describe('simpleDiff', () => {
  it('shows added lines', () => {
    const diff = simpleDiff('line1', 'line1\nline2');
    expect(diff).toContain('+line2');
  });

  it('shows removed lines', () => {
    const diff = simpleDiff('line1\nline2', 'line1');
    expect(diff).toContain('-line2');
  });

  it('shows modified lines', () => {
    const diff = simpleDiff('old value', 'new value');
    expect(diff).toContain('-old value');
    expect(diff).toContain('+new value');
  });

  it('returns empty for identical strings', () => {
    const diff = simpleDiff('same', 'same');
    expect(diff.length).toBe(0);
  });
});
