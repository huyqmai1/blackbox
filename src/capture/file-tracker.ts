import { execSync } from 'node:child_process';
import { getDb } from '../storage/db.js';

export interface FileSnapshot {
  trackedFiles: Map<string, string>;  // path -> git status code
  untrackedFiles: string[];
  isGitRepo: boolean;
}

export interface FileChange {
  file_path: string;
  change_type: 'added' | 'modified' | 'deleted' | 'renamed';
  diff: string | null;
}

export function takeSnapshot(cwd: string): FileSnapshot {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return { trackedFiles: new Map(), untrackedFiles: [], isGitRepo: false };
  }

  const trackedFiles = new Map<string, string>();
  const untrackedFiles: string[] = [];

  try {
    const status = execSync('git status --porcelain', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (status) {
      for (const line of status.split('\n')) {
        const code = line.slice(0, 2);
        const filePath = line.slice(3).trim();
        if (code === '??') {
          untrackedFiles.push(filePath);
        } else {
          trackedFiles.set(filePath, code);
        }
      }
    }
  } catch {
    // git status failed
  }

  return { trackedFiles, untrackedFiles, isGitRepo: true };
}

export function diffSnapshots(before: FileSnapshot, after: FileSnapshot, cwd: string): FileChange[] {
  if (!before.isGitRepo || !after.isGitRepo) return [];

  const changes: FileChange[] = [];
  const allPaths = new Set([
    ...before.trackedFiles.keys(),
    ...before.untrackedFiles,
    ...after.trackedFiles.keys(),
    ...after.untrackedFiles,
  ]);

  for (const path of allPaths) {
    const beforeStatus = before.trackedFiles.get(path) ?? (before.untrackedFiles.includes(path) ? '??' : null);
    const afterStatus = after.trackedFiles.get(path) ?? (after.untrackedFiles.includes(path) ? '??' : null);

    if (beforeStatus === afterStatus) continue;

    let changeType: FileChange['change_type'];
    if (!beforeStatus && afterStatus) {
      changeType = 'added';
    } else if (beforeStatus && !afterStatus) {
      changeType = 'deleted';
    } else {
      changeType = 'modified';
    }

    let diff: string | null = null;
    try {
      diff = execSync(`git diff -- "${path}"`, {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024,
      }).trim() || null;
    } catch {
      // diff may fail for binary files
    }

    changes.push({ file_path: path, change_type: changeType, diff });
  }

  return changes;
}

export function storeFileChanges(
  sessionId: string,
  changes: FileChange[],
  eventId?: number,
): void {
  const db = getDb();
  const timestamp = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO file_changes (session_id, event_id, file_path, change_type, diff, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: FileChange[]) => {
    for (const change of items) {
      stmt.run(
        sessionId,
        eventId ?? null,
        change.file_path,
        change.change_type,
        change.diff,
        timestamp,
      );
    }
  });

  insertMany(changes);
}

export function getFileChanges(sessionId: string): Array<{
  id: number;
  session_id: string;
  event_id: number | null;
  file_path: string;
  change_type: string;
  diff: string | null;
  timestamp: string;
}> {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM file_changes WHERE session_id = ? ORDER BY file_path ASC`
  ).all(sessionId) as Array<{
    id: number;
    session_id: string;
    event_id: number | null;
    file_path: string;
    change_type: string;
    diff: string | null;
    timestamp: string;
  }>;
}
