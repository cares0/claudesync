// ── Categories ──────────────────────────────────────────────
export const CATEGORIES = [
  'settings',
  'instructions',
  'hooks',
  'skills',
  'plugins',
  'teams',
  'ui',
] as const;

export type Category = (typeof CATEGORIES)[number];

// ── Gist _meta.json ─────────────────────────────────────────
export interface SyncMeta {
  version: number;
  tool: 'claudesync';
  last_sync: {
    machine: string;
    hostname: string;
    platform: string;
    timestamp: string;
    file_count: number;
    message?: string;
  };
  file_map: Record<string, FileMapEntry>;
  categories: Category[];
}

export interface FileMapEntry {
  path: string;        // relative to ~/.claude/, e.g. "hooks/pre-tool-use.sh"
  category: Category;
  encrypted?: boolean;
}

// ── Scanner ─────────────────────────────────────────────────
export interface ScannedFile {
  /** Absolute path on disk */
  absolutePath: string;
  /** Relative path from ~/.claude/ */
  relativePath: string;
  /** Gist-safe filename (slashes → --) */
  gistFilename: string;
  /** Category for selective sync */
  category: Category;
  /** File content (utf-8) */
  content: string;
}

// ── Gist API ────────────────────────────────────────────────
export interface GistFile {
  filename: string;
  content: string;
  truncated?: boolean;
  raw_url?: string;
  size?: number;
}

export interface Gist {
  id: string;
  description: string;
  public: boolean;
  files: Record<string, GistFile>;
  html_url: string;
  created_at: string;
  updated_at: string;
  history?: GistRevision[];
}

export interface GistRevision {
  version: string;
  user: { login: string } | null;
  committed_at: string;
  change_status: {
    total: number;
    additions: number;
    deletions: number;
  };
}

// ── Conflict ────────────────────────────────────────────────
export type ConflictAction = 'keep-local' | 'use-remote' | 'show-diff' | 'skip';

export interface FileChange {
  gistFilename: string;
  relativePath: string;
  category: Category;
  status: 'added' | 'modified' | 'deleted' | 'unchanged';
  localContent?: string;
  remoteContent?: string;
}

// ── Auth ────────────────────────────────────────────────────
export interface AuthConfig {
  token: string;
  gist_id?: string;
  machine_name?: string;
}

// ── CLI ─────────────────────────────────────────────────────
export interface PushOptions {
  only?: Category;
  force?: boolean;
  encrypt?: boolean;
  message?: string;
}

export interface PullOptions {
  only?: Category;
  force?: boolean;
}

export interface DiffOptions {
  only?: Category;
}

// ── Auto Sync ──────────────────────────────────────────────
export type AutoDirection = 'push' | 'pull';

export type PullConflictPolicy = 'overwrite' | 'skip' | 'backup';

export interface AutoConfig {
  direction: AutoDirection;
  interval_seconds: number;
  categories: Category[];
  encrypt: boolean;
  enabled: boolean;
  created_at: string;
  conflict_policy?: PullConflictPolicy;
}

export interface PrimaryDevice {
  machine: string;
  hostname: string;
  platform: string;
  registered_at: string;
}
