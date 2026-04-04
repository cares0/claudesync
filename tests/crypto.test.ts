import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../src/core/crypto.js';

describe('crypto', () => {
  const passphrase = 'test-passphrase-12345';

  it('encrypts and decrypts roundtrip', () => {
    const original = 'Hello, World! 안녕하세요!';
    const encrypted = encrypt(original, passphrase);
    const decrypted = decrypt(encrypted, passphrase);
    expect(decrypted).toBe(original);
  });

  it('encrypts multiline content', () => {
    const original = '{\n  "key": "value",\n  "nested": {\n    "arr": [1,2,3]\n  }\n}';
    const encrypted = encrypt(original, passphrase);
    const decrypted = decrypt(encrypted, passphrase);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext each time (random salt/iv)', () => {
    const original = 'same content';
    const a = encrypt(original, passphrase);
    const b = encrypt(original, passphrase);
    expect(a).not.toBe(b);
  });

  it('fails with wrong passphrase', () => {
    const encrypted = encrypt('secret', passphrase);
    expect(() => decrypt(encrypted, 'wrong-passphrase')).toThrow();
  });

  it('isEncrypted detects encrypted content', () => {
    const encrypted = encrypt('test', passphrase);
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('isEncrypted rejects plain text', () => {
    expect(isEncrypted('just plain text')).toBe(false);
    expect(isEncrypted('{ "json": true }')).toBe(false);
  });
});
