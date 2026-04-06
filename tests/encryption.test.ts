import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../src/core/crypto.js';
import type { AuthConfig } from '../src/types.js';

describe('encryption passphrase flow', () => {
  const passphraseA = 'correct-horse-battery-staple';
  const passphraseB = 'wrong-passphrase-entirely';

  it('encrypting with A and decrypting with A succeeds', () => {
    const plaintext = 'my secret settings content';
    const encrypted = encrypt(plaintext, passphraseA);
    const decrypted = decrypt(encrypted, passphraseA);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypting with A and decrypting with B throws', () => {
    const plaintext = 'sensitive data';
    const encrypted = encrypt(plaintext, passphraseA);
    expect(() => decrypt(encrypted, passphraseB)).toThrow();
  });

  it('roundtrip preserves unicode and multiline content', () => {
    const content = '한국어 테스트\n日本語\n{"emoji": "🔐"}';
    const encrypted = encrypt(content, passphraseA);
    expect(decrypt(encrypted, passphraseA)).toBe(content);
  });

  it('encrypted output starts with magic prefix', () => {
    const encrypted = encrypt('test', passphraseA);
    expect(encrypted.startsWith('CLAUDESYNC_ENC:')).toBe(true);
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('same plaintext produces different ciphertext each time', () => {
    const a = encrypt('same', passphraseA);
    const b = encrypt('same', passphraseA);
    expect(a).not.toBe(b);
  });

  it('decrypt rejects non-encrypted input', () => {
    expect(() => decrypt('plain text', passphraseA)).toThrow('Not encrypted by claudesync');
  });

  it('handles empty string content', () => {
    const encrypted = encrypt('', passphraseA);
    expect(decrypt(encrypted, passphraseA)).toBe('');
  });
});

describe('AuthConfig type', () => {
  it('accepts encrypt_passphrase field', () => {
    const config: AuthConfig = {
      token: 'ghp_test123',
      gist_id: 'abc123',
      encrypt_passphrase: 'my-secret-passphrase',
    };
    expect(config.encrypt_passphrase).toBe('my-secret-passphrase');
  });

  it('encrypt_passphrase is optional', () => {
    const config: AuthConfig = {
      token: 'ghp_test123',
    };
    expect(config.encrypt_passphrase).toBeUndefined();
  });
});
