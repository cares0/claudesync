import { readFileSync, writeFileSync, unlinkSync, existsSync, chmodSync } from 'node:fs';
import { autoConfigPath } from '../utils/paths.js';
import type { AutoConfig } from '../types.js';

export function saveAutoConfig(config: AutoConfig): void {
  const path = autoConfigPath();
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8');
  chmodSync(path, 0o600);
}

export function loadAutoConfig(): AutoConfig | null {
  const path = autoConfigPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as AutoConfig;
  } catch {
    return null;
  }
}

export function removeAutoConfig(): void {
  const path = autoConfigPath();
  if (existsSync(path)) unlinkSync(path);
}
