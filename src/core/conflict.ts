import { diffLines } from 'diff';
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
  const localMap = new Map(localFiles.map((f) => [f.relativePath, f]));
  const meta = parseMeta(gist);

  // Build remote map by relativePath (handles both old/new encoding)
  const remoteMap = new Map<string, { gistFilename: string; content: string | undefined }>();
  for (const [gistName, gistFile] of Object.entries(gist.files)) {
    if (gistName === META_FILE) continue;
    const entry = meta?.file_map[gistName];
    const relativePath = entry?.path ?? fromGistFilename(gistName);
    remoteMap.set(relativePath, { gistFilename: gistName, content: gistFile?.content ?? undefined });
  }

  // Check local files against remote
  for (const [relPath, local] of localMap) {
    const remote = remoteMap.get(relPath);
    if (!remote) {
      changes.push({
        gistFilename: local.gistFilename,
        relativePath: relPath,
        category: local.category,
        status: 'added',
        localContent: local.content,
      });
    } else if (remote.content !== local.content) {
      changes.push({
        gistFilename: local.gistFilename,
        relativePath: relPath,
        category: local.category,
        status: 'modified',
        localContent: local.content,
        remoteContent: remote.content,
      });
    } else {
      changes.push({
        gistFilename: local.gistFilename,
        relativePath: relPath,
        category: local.category,
        status: 'unchanged',
        localContent: local.content,
        remoteContent: remote.content,
      });
    }
    remoteMap.delete(relPath);
  }

  // Files in remote but not local → deleted locally
  for (const [relPath, remote] of remoteMap) {
    const entry = meta?.file_map[remote.gistFilename];
    changes.push({
      gistFilename: remote.gistFilename,
      relativePath: relPath,
      category: (entry?.category ?? 'settings') as Category,
      status: 'deleted',
      remoteContent: remote.content,
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
  const localMap = new Map(localFiles.map((f) => [f.relativePath, f]));
  const meta = parseMeta(gist);

  for (const [gistName, gistFile] of Object.entries(gist.files)) {
    if (gistName === META_FILE) continue;
    if (!gistFile?.content) continue;

    const entry = meta?.file_map[gistName];
    const relativePath = entry?.path ?? fromGistFilename(gistName);
    const category = (entry?.category ?? 'settings') as Category;

    const local = localMap.get(relativePath);

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

/** Generate a unified diff between two strings using LCS-based algorithm */
export function simpleDiff(a: string, b: string): string[] {
  const changes = diffLines(a, b);
  const result: string[] = [];
  for (const change of changes) {
    const lines = change.value.replace(/\n$/, '').split('\n');
    for (const line of lines) {
      if (change.added) result.push(`+${line}`);
      else if (change.removed) result.push(`-${line}`);
      // unchanged lines omitted
    }
  }
  return result;
}
