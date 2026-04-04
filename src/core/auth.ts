import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { authFilePath } from '../utils/paths.js';
import type { AuthConfig } from '../types.js';

const KEYCHAIN_SERVICE = 'claudesync';
const KEYCHAIN_ACCOUNT = 'github-token';

// ── Keychain (macOS) ────────────────────────────────────────
function keychainSet(token: string): boolean {
  try {
    execSync(
      `security add-generic-password -U -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" -w "${token}"`,
      { stdio: 'ignore' },
    );
    return true;
  } catch {
    return false;
  }
}

function keychainGet(): string | null {
  try {
    const result = execSync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" -w`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return result.trim();
  } catch {
    return null;
  }
}

function keychainDelete(): boolean {
  try {
    execSync(
      `security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}"`,
      { stdio: 'ignore' },
    );
    return true;
  } catch {
    return false;
  }
}

// ── Linux secret-tool ───────────────────────────────────────
function secretToolSet(token: string): boolean {
  try {
    execSync(
      `echo -n "${token}" | secret-tool store --label="claudesync" service claudesync account github-token`,
      { stdio: 'ignore' },
    );
    return true;
  } catch {
    return false;
  }
}

function secretToolGet(): string | null {
  try {
    const result = execSync(
      'secret-tool lookup service claudesync account github-token',
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return result.trim() || null;
  } catch {
    return null;
  }
}

// ── File fallback ───────────────────────────────────────────
function fileSet(config: AuthConfig): void {
  const path = authFilePath();
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8');
  chmodSync(path, 0o600);
}

function fileGet(): AuthConfig | null {
  const path = authFilePath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────

/** Save token using the best available method */
export function saveToken(token: string): void {
  if (process.platform === 'darwin') {
    keychainSet(token);
  } else if (process.platform === 'linux') {
    secretToolSet(token);
  }
  // Always save to file as well (for gist_id, machine_name)
  const existing = fileGet() || { token: '' };
  existing.token = token;
  fileSet(existing);
}

/** Load token from the best available method */
export function loadToken(): string | null {
  // Try keychain/secret-tool first
  if (process.platform === 'darwin') {
    const t = keychainGet();
    if (t) return t;
  } else if (process.platform === 'linux') {
    const t = secretToolGet();
    if (t) return t;
  }
  // Fallback to file
  const config = fileGet();
  return config?.token || null;
}

/** Load full auth config */
export function loadConfig(): AuthConfig | null {
  return fileGet();
}

/** Save full auth config */
export function saveConfig(config: AuthConfig): void {
  saveToken(config.token);
  fileSet(config);
}

/** Delete stored credentials */
export function deleteAuth(): void {
  if (process.platform === 'darwin') keychainDelete();
  const path = authFilePath();
  if (existsSync(path)) {
    writeFileSync(path, '', 'utf-8');
  }
}

/** Validate token by calling GitHub API */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'claudesync',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** OAuth Device Flow */
export async function deviceFlow(): Promise<string> {
  const CLIENT_ID = 'Ov23liVJuAxxwWUqtala';

  // Step 1: Request device code
  const codeRes = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: 'gist' }),
  });
  const codeData = (await codeRes.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
    expires_in: number;
  };

  console.log(`\n  URL: ${codeData.verification_uri}`);
  console.log(`  Code: ${codeData.user_code}\n`);

  // Step 2: Poll for token
  const interval = (codeData.interval || 5) * 1000;
  const deadline = Date.now() + codeData.expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: codeData.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (tokenData.access_token) return tokenData.access_token;
    if (tokenData.error === 'authorization_pending') continue;
    if (tokenData.error === 'slow_down') {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    throw new Error(`OAuth error: ${tokenData.error}`);
  }

  throw new Error('Device flow timed out');
}
