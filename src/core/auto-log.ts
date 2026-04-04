import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import { autoLogPath } from '../utils/paths.js';

type LogStatus = 'success' | 'error' | 'skipped';

export function appendLog(direction: string, status: LogStatus, message: string): void {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} [${direction}] [${status}] ${message}\n`;
  appendFileSync(autoLogPath(), line, 'utf-8');
}

export function readRecentLogs(count: number): string[] {
  const path = autoLogPath();
  if (!existsSync(path)) return [];

  const content = readFileSync(path, 'utf-8').trim();
  if (!content) return [];

  const lines = content.split('\n');
  return lines.slice(-count);
}
