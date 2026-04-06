import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { autoLogPath } from '../utils/paths.js';

type LogStatus = 'success' | 'error' | 'skipped';

const MAX_LOG_LINES = 1000;

export function appendLog(direction: string, status: LogStatus, message: string): void {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} [${direction}] [${status}] ${message}\n`;
  appendFileSync(autoLogPath(), line, 'utf-8');
  rotateIfNeeded();
}

function rotateIfNeeded(): void {
  const path = autoLogPath();
  if (!existsSync(path)) return;
  try {
    const content = readFileSync(path, 'utf-8');
    const lines = content.split('\n');
    if (lines.length > MAX_LOG_LINES + 100) {
      const trimmed = lines.slice(-MAX_LOG_LINES).join('\n');
      writeFileSync(path, trimmed, 'utf-8');
    }
  } catch {
    // best-effort
  }
}

export function readRecentLogs(count: number): string[] {
  const path = autoLogPath();
  if (!existsSync(path)) return [];

  const content = readFileSync(path, 'utf-8').trim();
  if (!content) return [];

  const lines = content.split('\n');
  return lines.slice(-count);
}
