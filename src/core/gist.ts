import { hostname } from 'node:os';
import type { Gist, GistRevision, SyncMeta, ScannedFile } from '../types.js';
import { machineName, platformString } from '../utils/paths.js';
import { CATEGORIES } from '../types.js';

const API = 'https://api.github.com';
const GIST_DESC = 'claudesync: Claude Code settings';
const META_FILE = '_meta.json';

function headers(token: string): Record<string, string> {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'claudesync',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function apiRequest<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(token), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Find existing claudesync Gist ───────────────────────────
export async function findGist(token: string): Promise<Gist | null> {
  const gists = await apiRequest<Gist[]>(`${API}/gists?per_page=100`, token);
  return gists.find((g) => g.description === GIST_DESC && g.files[META_FILE]) ?? null;
}

// ── Get Gist by ID ──────────────────────────────────────────
export async function getGist(token: string, gistId: string): Promise<Gist> {
  return apiRequest<Gist>(`${API}/gists/${gistId}`, token);
}

// ── Create new Gist ─────────────────────────────────────────
export async function createGist(
  token: string,
  files: ScannedFile[],
  encryptedFiles?: Set<string>,
  message?: string,
): Promise<Gist> {
  const meta = buildMeta(files, encryptedFiles, message);
  const gistFiles: Record<string, { content: string }> = {
    [META_FILE]: { content: JSON.stringify(meta, null, 2) },
  };

  for (const f of files) {
    gistFiles[f.gistFilename] = { content: f.content };
  }

  return apiRequest<Gist>(`${API}/gists`, token, {
    method: 'POST',
    body: JSON.stringify({
      description: GIST_DESC,
      public: false,
      files: gistFiles,
    }),
  });
}

// ── Update existing Gist (partial) ─────────────────────────
export async function updateGist(
  token: string,
  gistId: string,
  files: ScannedFile[],
  deletedFiles?: string[],
  encryptedFiles?: Set<string>,
  message?: string,
): Promise<Gist> {
  const meta = buildMeta(files, encryptedFiles, message);
  const gistFiles: Record<string, { content: string } | null> = {
    [META_FILE]: { content: JSON.stringify(meta, null, 2) },
  };

  for (const f of files) {
    gistFiles[f.gistFilename] = { content: f.content };
  }

  // Mark deleted files as null to remove from Gist
  if (deletedFiles) {
    for (const name of deletedFiles) {
      gistFiles[name] = null;
    }
  }

  return apiRequest<Gist>(`${API}/gists/${gistId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ files: gistFiles }),
  });
}

// ── Get Gist revision history ───────────────────────────────
export async function getHistory(token: string, gistId: string): Promise<GistRevision[]> {
  const gist = await apiRequest<Gist>(`${API}/gists/${gistId}`, token);
  return gist.history ?? [];
}

// ── Get Gist at a specific revision ─────────────────────────
export async function getGistAtRevision(
  token: string,
  gistId: string,
  sha: string,
): Promise<Gist> {
  return apiRequest<Gist>(`${API}/gists/${gistId}/${sha}`, token);
}

// ── Parse meta from Gist ────────────────────────────────────
export function parseMeta(gist: Gist): SyncMeta | null {
  const metaFile = gist.files[META_FILE];
  if (!metaFile?.content) return null;
  try {
    return JSON.parse(metaFile.content) as SyncMeta;
  } catch {
    return null;
  }
}

// ── Build _meta.json ────────────────────────────────────────
function buildMeta(files: ScannedFile[], encryptedFiles?: Set<string>, message?: string): SyncMeta {
  const fileMap: SyncMeta['file_map'] = {};
  for (const f of files) {
    fileMap[f.gistFilename] = {
      path: f.relativePath,
      category: f.category,
      ...(encryptedFiles?.has(f.gistFilename) && { encrypted: true }),
    };
  }

  return {
    version: 1,
    tool: 'claudesync',
    last_sync: {
      machine: machineName(),
      hostname: getHostname(),
      platform: platformString(),
      timestamp: new Date().toISOString(),
      file_count: files.length,
      ...(message && { message }),
    },
    file_map: fileMap,
    categories: [...CATEGORIES],
  };
}

function getHostname(): string {
  try {
    return hostname();
  } catch {
    return 'unknown';
  }
}
