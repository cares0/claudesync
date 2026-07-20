import { readFileSync, writeFileSync, unlinkSync, existsSync, chmodSync } from 'node:fs';
import { autoConfigPath } from '../utils/paths.js';
import { CATEGORIES } from '../types.js';
import type { AutoConfig, Category } from '../types.js';

export function saveAutoConfig(config: AutoConfig): void {
  const path = autoConfigPath();
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8');
  chmodSync(path, 0o600);
}

export function loadAutoConfig(): AutoConfig | null {
  const path = autoConfigPath();
  if (!existsSync(path)) return null;
  try {
    const config = JSON.parse(readFileSync(path, 'utf-8')) as AutoConfig;
    // Filter out categories from older versions (e.g. 'plugins', 'teams') that no longer exist
    config.categories = config.categories.filter((c) => (CATEGORIES as readonly string[]).includes(c as Category));
    return config;
  } catch {
    return null;
  }
}

export function removeAutoConfig(): void {
  const path = autoConfigPath();
  if (existsSync(path)) unlinkSync(path);
}
