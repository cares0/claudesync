import { describe, it, expect } from 'vitest';
import { compareForPush, compareForPull, simpleDiff } from '../src/core/conflict.js';
import type { Gist, ScannedFile, SyncMeta } from '../src/types.js';

/** Helper: build a minimal Gist object with optional _meta.json */
function makeGist(
  files: Record<string, string>,
  meta?: SyncMeta,
): Gist {
  const gistFiles: Gist['files'] = {};
  for (const [name, content] of Object.entries(files)) {
    gistFiles[name] = { filename: name, content };
  }
  if (meta) {
    gistFiles['_meta.json'] = {
      filename: '_meta.json',
      content: JSON.stringify(meta),
    };
  }
  return {
    id: 'gist-123',
    description: 'test gist',
    public: false,
    files: gistFiles,
    html_url: 'https://gist.github.com/gist-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };
}

/** Helper: build a ScannedFile */
function makeLocal(relativePath: string, content: string, gistFilename?: string): ScannedFile {
  return {
    absolutePath: `/home/user/.claude/${relativePath}`,
    relativePath,
    gistFilename: gistFilename ?? relativePath.replace(/\//g, '%2F'),
    category: 'settings',
    content,
  };
}

// ── compareForPush ────────────────────────────────────────────

describe('compareForPush', () => {
  it('detects added files (local only)', () => {
    const local = [makeLocal('settings.json', '{"key":"val"}')];
    const gist = makeGist({});
    const changes = compareForPush(local, gist);
    expect(changes).toHaveLength(1);
    expect(changes[0].status).toBe('added');
    expect(changes[0].relativePath).toBe('settings.json');
    expect(changes[0].localContent).toBe('{"key":"val"}');
  });

  it('detects modified files', () => {
    const local = [makeLocal('settings.json', 'new content')];
    const gist = makeGist({ 'settings.json': 'old content' });
    const changes = compareForPush(local, gist);
    const modified = changes.filter((c) => c.status === 'modified');
    expect(modified).toHaveLength(1);
    expect(modified[0].localContent).toBe('new content');
    expect(modified[0].remoteContent).toBe('old content');
  });

  it('detects deleted files (remote only)', () => {
    const local: ScannedFile[] = [];
    const gist = makeGist({ 'settings.json': 'content' });
    const changes = compareForPush(local, gist);
    expect(changes).toHaveLength(1);
    expect(changes[0].status).toBe('deleted');
    expect(changes[0].remoteContent).toBe('content');
  });

  it('detects unchanged files', () => {
    const local = [makeLocal('settings.json', 'same')];
    const gist = makeGist({ 'settings.json': 'same' });
    const changes = compareForPush(local, gist);
    expect(changes).toHaveLength(1);
    expect(changes[0].status).toBe('unchanged');
  });

  it('handles mixed added/modified/deleted/unchanged', () => {
    const local = [
      makeLocal('a.json', 'new-a'),        // added
      makeLocal('b.json', 'modified-b'),    // modified
      makeLocal('c.json', 'same-c'),        // unchanged
      // d.json not local → deleted
    ];
    const gist = makeGist({
      'b.json': 'old-b',
      'c.json': 'same-c',
      'd.json': 'old-d',
    });
    const changes = compareForPush(local, gist);
    const statuses = Object.fromEntries(changes.map((c) => [c.relativePath, c.status]));
    expect(statuses).toEqual({
      'a.json': 'added',
      'b.json': 'modified',
      'c.json': 'unchanged',
      'd.json': 'deleted',
    });
  });

  it('matches by relativePath when remote uses legacy "--" encoding and local uses "%2F"', () => {
    // Remote has legacy encoding "hooks--pre-tool-use.sh"
    // _meta.json maps it to the real path
    const meta: SyncMeta = {
      version: 1,
      tool: 'claudesync',
      last_sync: {
        machine: 'test',
        hostname: 'test',
        platform: 'test',
        timestamp: '2025-01-01T00:00:00Z',
        file_count: 1,
      },
      file_map: {
        'hooks--pre-tool-use.sh': {
          path: 'hooks/pre-tool-use.sh',
          category: 'hooks',
        },
      },
      categories: ['hooks'],
    };
    const local = [makeLocal('hooks/pre-tool-use.sh', 'same content', 'hooks%2Fpre-tool-use.sh')];
    const gist = makeGist({ 'hooks--pre-tool-use.sh': 'same content' }, meta);
    const changes = compareForPush(local, gist);
    const hook = changes.find((c) => c.relativePath === 'hooks/pre-tool-use.sh');
    expect(hook).toBeDefined();
    expect(hook!.status).toBe('unchanged');
  });

  it('detects modification across encoding migration (legacy remote, new local)', () => {
    const meta: SyncMeta = {
      version: 1,
      tool: 'claudesync',
      last_sync: {
        machine: 'test',
        hostname: 'test',
        platform: 'test',
        timestamp: '2025-01-01T00:00:00Z',
        file_count: 1,
      },
      file_map: {
        'hooks--startup.sh': {
          path: 'hooks/startup.sh',
          category: 'hooks',
        },
      },
      categories: ['hooks'],
    };
    const local = [makeLocal('hooks/startup.sh', 'updated', 'hooks%2Fstartup.sh')];
    const gist = makeGist({ 'hooks--startup.sh': 'original' }, meta);
    const changes = compareForPush(local, gist);
    const hook = changes.find((c) => c.relativePath === 'hooks/startup.sh');
    expect(hook).toBeDefined();
    expect(hook!.status).toBe('modified');
  });
});

// ── compareForPull ────────────────────────────────────────────

describe('compareForPull', () => {
  it('detects remotely added files (not present locally)', () => {
    const gist = makeGist({ 'new-file.json': 'remote content' });
    const local: ScannedFile[] = [];
    const changes = compareForPull(gist, local);
    expect(changes).toHaveLength(1);
    expect(changes[0].status).toBe('added');
    expect(changes[0].remoteContent).toBe('remote content');
  });

  it('detects remotely modified files', () => {
    const gist = makeGist({ 'settings.json': 'updated remotely' });
    const local = [makeLocal('settings.json', 'local version')];
    const changes = compareForPull(gist, local);
    const mod = changes.find((c) => c.status === 'modified');
    expect(mod).toBeDefined();
    expect(mod!.remoteContent).toBe('updated remotely');
    expect(mod!.localContent).toBe('local version');
  });

  it('detects unchanged files on pull', () => {
    const gist = makeGist({ 'settings.json': 'same' });
    const local = [makeLocal('settings.json', 'same')];
    const changes = compareForPull(gist, local);
    expect(changes).toHaveLength(1);
    expect(changes[0].status).toBe('unchanged');
  });

  it('skips _meta.json in pull comparison', () => {
    const gist = makeGist({});
    // Manually add _meta.json
    gist.files['_meta.json'] = { filename: '_meta.json', content: '{}' };
    const changes = compareForPull(gist, []);
    expect(changes).toHaveLength(0);
  });

  it('resolves legacy encoding via _meta.json file_map on pull', () => {
    const meta: SyncMeta = {
      version: 1,
      tool: 'claudesync',
      last_sync: {
        machine: 'test',
        hostname: 'test',
        platform: 'test',
        timestamp: '2025-01-01T00:00:00Z',
        file_count: 1,
      },
      file_map: {
        'hooks--init.sh': {
          path: 'hooks/init.sh',
          category: 'hooks',
        },
      },
      categories: ['hooks'],
    };
    const gist = makeGist({ 'hooks--init.sh': 'echo hello' }, meta);
    const local = [makeLocal('hooks/init.sh', 'echo hello', 'hooks%2Finit.sh')];
    const changes = compareForPull(gist, local);
    expect(changes).toHaveLength(1);
    expect(changes[0].status).toBe('unchanged');
    expect(changes[0].relativePath).toBe('hooks/init.sh');
  });
});

// ── simpleDiff ────────────────────────────────────────────────

describe('simpleDiff', () => {
  it('shows insertions with + prefix', () => {
    const result = simpleDiff('a\n', 'a\nb\n');
    expect(result).toContain('+b');
  });

  it('shows deletions with - prefix', () => {
    const result = simpleDiff('a\nb\n', 'a\n');
    expect(result).toContain('-b');
  });

  it('shows both - and + for modifications', () => {
    const result = simpleDiff('hello\n', 'world\n');
    expect(result).toContain('-hello');
    expect(result).toContain('+world');
  });

  it('returns empty array for identical content', () => {
    const result = simpleDiff('same\n', 'same\n');
    expect(result).toHaveLength(0);
  });

  it('handles multiline diff correctly', () => {
    const a = 'line1\nline2\nline3\n';
    const b = 'line1\nmodified\nline3\nnew-line4\n';
    const result = simpleDiff(a, b);
    expect(result).toContain('-line2');
    expect(result).toContain('+modified');
    expect(result).toContain('+new-line4');
  });
});
