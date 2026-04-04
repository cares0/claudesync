import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';

const MAGIC_PREFIX = 'CLAUDESYNC_ENC:';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

/** Derive a key from a passphrase using scrypt */
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LENGTH, SCRYPT_PARAMS);
}

/** Encrypt content with AES-256-GCM.
 *  Output format: base64(salt + iv + authTag + ciphertext) */
export function encrypt(content: string, passphrase: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(passphrase, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(content, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  return MAGIC_PREFIX + combined.toString('base64');
}

/** Decrypt content encrypted with encrypt() */
export function decrypt(encoded: string, passphrase: string): string {
  if (!encoded.startsWith(MAGIC_PREFIX)) throw new Error('Not encrypted by claudesync');
  const combined = Buffer.from(encoded.slice(MAGIC_PREFIX.length), 'base64');

  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf-8');
}

/** Check if a string looks like claudesync-encrypted content */
export function isEncrypted(content: string): boolean {
  return content.startsWith(MAGIC_PREFIX);
}
