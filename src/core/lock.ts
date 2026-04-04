import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { lockFilePath } from '../utils/paths.js';

const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface LockData {
  pid: number;
  timestamp: number;
}

export function acquireLock(): boolean {
  const path = lockFilePath();

  if (existsSync(path)) {
    try {
      const data: LockData = JSON.parse(readFileSync(path, 'utf-8'));
      const age = Date.now() - data.timestamp;
      if (age > STALE_TIMEOUT_MS) {
        unlinkSync(path);
      } else {
        return false;
      }
    } catch {
      unlinkSync(path);
    }
  }

  const lockData: LockData = { pid: process.pid, timestamp: Date.now() };
  writeFileSync(path, JSON.stringify(lockData), 'utf-8');
  return true;
}

export function releaseLock(): void {
  const path = lockFilePath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

export function isLocked(): boolean {
  const path = lockFilePath();
  if (!existsSync(path)) return false;

  try {
    const data: LockData = JSON.parse(readFileSync(path, 'utf-8'));
    const age = Date.now() - data.timestamp;
    if (age > STALE_TIMEOUT_MS) {
      unlinkSync(path);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
