import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { claudeDir, toGistFilename } from '../utils/paths.js';
import type { Category, ScannedFile } from '../types.js';

interface SyncTarget {
  path: string;       // relative to ~/.claude/
  category: Category;
  isDir?: boolean;
}

const SYNC_TARGETS: SyncTarget[] = [
  // settings
  { path: 'settings.json', category: 'settings' },
  { path: 'keybindings.json', category: 'settings' },
  { path: 'policy-limits.json', category: 'settings' },
  { path: 'remote-settings.json', category: 'settings' },
  // instructions
  { path: 'CLAUDE.md', category: 'instructions' },
  // hooks
  { path: 'hooks', category: 'hooks', isDir: true },
  // skills
  { path: 'skills', category: 'skills', isDir: true },
  // plugins
  { path: 'plugins/installed_plugins.json', category: 'plugins' },
  { path: 'plugins/known_marketplaces.json', category: 'plugins' },
  { path: 'plugins/blocklist.json', category: 'plugins' },
  // teams
  { path: 'teams', category: 'teams', isDir: true },
  // ui
  { path: 'statusline-command.sh', category: 'ui' },
];

const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', '.gitkeep']);
const IGNORED_EXTENSIONS = new Set(['.swp', '.swo', '.tmp', '.bak']);

function shouldIgnore(name: string): boolean {
  if (IGNORED_FILES.has(name)) return true;
  for (const ext of IGNORED_EXTENSIONS) {
    if (name.endsWith(ext)) return true;
  }
  return false;
}

/** Recursively collect files from a directory */
function collectDir(dirPath: string, baseDir: string, category: Category): ScannedFile[] {
  const files: ScannedFile[] = [];
  if (!existsSync(dirPath)) return files;

  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectDir(fullPath, baseDir, category));
    } else if (entry.isFile()) {
      const relPath = relative(baseDir, fullPath);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        files.push({
          absolutePath: fullPath,
          relativePath: relPath,
          gistFilename: toGistFilename(relPath),
          category,
          content,
        });
      } catch {
        // skip unreadable files
      }
    }
  }
  return files;
}

/** Scan ~/.claude/ for syncable files */
export function scanFiles(filterCategory?: Category): ScannedFile[] {
  const base = claudeDir();
  const files: ScannedFile[] = [];

  for (const target of SYNC_TARGETS) {
    if (filterCategory && target.category !== filterCategory) continue;

    const fullPath = join(base, target.path);
    if (!existsSync(fullPath)) continue;

    if (target.isDir) {
      files.push(...collectDir(fullPath, base, target.category));
    } else {
      const stat = statSync(fullPath);
      if (!stat.isFile()) continue;
      try {
        const content = readFileSync(fullPath, 'utf-8');
        files.push({
          absolutePath: fullPath,
          relativePath: target.path,
          gistFilename: toGistFilename(target.path),
          category: target.category,
          content,
        });
      } catch {
        // skip unreadable
      }
    }
  }

  return files;
}

/** List all sync targets for display */
export function listTargets(): SyncTarget[] {
  return [...SYNC_TARGETS];
}
