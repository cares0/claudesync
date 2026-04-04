import { homedir, hostname } from 'node:os';
import { join, resolve, relative, normalize } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

/** ~/.claude */
export function claudeDir(): string {
  return join(homedir(), '.claude');
}

/** ~/.claudesync (our config dir) */
export function configDir(): string {
  const dir = join(homedir(), '.claudesync');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/** ~/.claudesync/auth.json */
export function authFilePath(): string {
  return join(configDir(), 'auth.json');
}

/** Convert a relative path (from ~/.claude/) to a Gist-safe filename.
 *  e.g. "hooks/pre-tool-use.sh" → "hooks--pre-tool-use.sh" */
export function toGistFilename(relativePath: string): string {
  return relativePath.replace(/\//g, '--');
}

/** Convert a Gist filename back to a relative path.
 *  e.g. "hooks--pre-tool-use.sh" → "hooks/pre-tool-use.sh" */
export function fromGistFilename(gistFilename: string): string {
  return gistFilename.replace(/--/g, '/');
}

/** Validate that a path doesn't escape ~/.claude/ (traversal prevention) */
export function isPathSafe(relativePath: string): boolean {
  const normalized = normalize(relativePath);
  if (normalized.startsWith('..') || normalized.startsWith('/')) return false;
  const abs = resolve(claudeDir(), normalized);
  return abs.startsWith(claudeDir());
}

/** Get the machine name: env var or hostname */
export function machineName(): string {
  return process.env.CLAUDESYNC_MACHINE || hostname().split('.')[0];
}

/** Get platform string (e.g. "darwin-arm64") */
export function platformString(): string {
  return `${process.platform}-${process.arch}`;
}

/** ~/.claudesync/machine-id */
export function machineIdPath(): string {
  return join(configDir(), 'machine-id');
}

/** Get or create a persistent unique machine ID */
export function getMachineId(): string {
  const path = machineIdPath();
  if (existsSync(path)) {
    const id = readFileSync(path, 'utf-8').trim();
    if (id) return id;
  }
  const id = randomUUID();
  writeFileSync(path, id, 'utf-8');
  return id;
}

/** ~/.claudesync/auto.json */
export function autoConfigPath(): string {
  return join(configDir(), 'auto.json');
}

/** ~/.claudesync/auto.log */
export function autoLogPath(): string {
  return join(configDir(), 'auto.log');
}

/** ~/.claudesync/sync.lock */
export function lockFilePath(): string {
  return join(configDir(), 'sync.lock');
}

/** ~/.claudesync/notifications.json */
export function pendingNotificationsPath(): string {
  return join(configDir(), 'notifications.json');
}

/** ~/.claudesync/config.json */
export function userConfigPath(): string {
  return join(configDir(), 'config.json');
}
