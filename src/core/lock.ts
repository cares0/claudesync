import { openSync, writeSync, closeSync, readFileSync, unlinkSync, existsSync, constants } from 'node:fs';
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
      try { unlinkSync(path); } catch { /* already removed */ }
    }
  }

  const lockData: LockData = { pid: process.pid, timestamp: Date.now() };
  try {
    const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL);
    writeSync(fd, JSON.stringify(lockData));
    closeSync(fd);
    return true;
  } catch {
    return false; // Another process created the lock between our check and write
  }
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
