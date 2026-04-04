import type { FileChange, Category, ScannedFile, Gist } from '../types.js';
import { fromGistFilename } from '../utils/paths.js';
import { parseMeta } from './gist.js';

const META_FILE = '_meta.json';

/** Compare local files against remote Gist to find changes */
export function compareForPush(
  localFiles: ScannedFile[],
  gist: Gist,
): FileChange[] {
  const changes: FileChange[] = [];
  const localMap = new Map(localFiles.map((f) => [f.gistFilename, f]));
  const remoteNames = new Set(
    Object.keys(gist.files).filter((n) => n !== META_FILE),
  );

  // Check local files against remote
  for (const [gistName, local] of localMap) {
    const remote = gist.files[gistName];
    if (!remote) {
      changes.push({
        gistFilename: gistName,
        relativePath: local.relativePath,
        category: local.category,
        status: 'added',
        localContent: local.content,
      });
    } else if (remote.content !== local.content) {
      changes.push({
        gistFilename: gistName,
        relativePath: local.relativePath,
        category: local.category,
        status: 'modified',
        localContent: local.content,
        remoteContent: remote.content ?? undefined,
      });
    } else {
      changes.push({
        gistFilename: gistName,
        relativePath: local.relativePath,
        category: local.category,
        status: 'unchanged',
        localContent: local.content,
        remoteContent: remote.content ?? undefined,
      });
    }
    remoteNames.delete(gistName);
  }

  // Files in remote but not local → deleted locally
  const meta = parseMeta(gist);
  for (const gistName of remoteNames) {
    const entry = meta?.file_map[gistName];
    changes.push({
      gistFilename: gistName,
      relativePath: entry?.path ?? fromGistFilename(gistName),
      category: (entry?.category ?? 'settings') as Category,
      status: 'deleted',
      remoteContent: gist.files[gistName]?.content ?? undefined,
    });
  }

  return changes;
}

/** Compare remote Gist against local files for pull */
export function compareForPull(
  gist: Gist,
  localFiles: ScannedFile[],
): FileChange[] {
  const changes: FileChange[] = [];
  const localMap = new Map(localFiles.map((f) => [f.gistFilename, f]));
  const meta = parseMeta(gist);

  for (const [gistName, gistFile] of Object.entries(gist.files)) {
    if (gistName === META_FILE) continue;
    if (!gistFile?.content) continue;

    const local = localMap.get(gistName);
    const entry = meta?.file_map[gistName];
    const relativePath = entry?.path ?? fromGistFilename(gistName);
    const category = (entry?.category ?? 'settings') as Category;

    if (!local) {
      changes.push({
        gistFilename: gistName,
        relativePath,
        category,
        status: 'added',
        remoteContent: gistFile.content,
      });
    } else if (local.content !== gistFile.content) {
      changes.push({
        gistFilename: gistName,
        relativePath,
        category,
        status: 'modified',
        localContent: local.content,
        remoteContent: gistFile.content,
      });
    } else {
      changes.push({
        gistFilename: gistName,
        relativePath,
        category,
        status: 'unchanged',
        localContent: local.content,
        remoteContent: gistFile.content,
      });
    }
  }

  return changes;
}

/** Generate a simple unified diff between two strings */
export function simpleDiff(a: string, b: string): string[] {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: string[] = [];

  const maxLen = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < maxLen; i++) {
    const lineA = linesA[i];
    const lineB = linesB[i];

    if (lineA === undefined) {
      result.push(`+${lineB}`);
    } else if (lineB === undefined) {
      result.push(`-${lineA}`);
    } else if (lineA !== lineB) {
      result.push(`-${lineA}`);
      result.push(`+${lineB}`);
    }
  }

  return result;
}
