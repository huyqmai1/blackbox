import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSession, endSession } from '../storage/sessions.js';
import { appendEvent } from '../storage/events.js';
import { takeSnapshot, diffSnapshots, storeFileChanges, type FileSnapshot, type FileChange } from './file-tracker.js';
import { renderSessionSummary, promptMicroAnnotation } from '../ui/session-summary.js';

export interface ExecOptions {
  command: string[];
  cwd?: string;
  name?: string;
  noPrompt?: boolean;
}

export async function execWithCapture(opts: ExecOptions): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const commandStr = opts.command.join(' ');

  // Detect agent from command
  const agent = detectAgent(commandStr);

  // Get git branch if in a git repo
  let gitBranch: string | undefined;
  try {
    const { execSync } = await import('node:child_process');
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    // Not in a git repo
  }

  // Create session
  const session = createSession({
    source: 'exec',
    agent,
    command: commandStr,
    cwd,
    git_branch: gitBranch,
    metadata_json: JSON.stringify({ name: opts.name }),
  });

  // Record session start
  appendEvent({
    session_id: session.id,
    type: 'session_start',
    data: { command: commandStr, cwd, agent, git_branch: gitBranch },
  });

  // Take file snapshot before execution
  let beforeSnapshot: FileSnapshot | undefined;
  try {
    beforeSnapshot = takeSnapshot(cwd);
  } catch {
    // Non-fatal: file tracking is best-effort
  }

  const startTime = Date.now();

  // Use macOS/Linux `script` command to provide a real PTY to the child
  // process while capturing output to a file. This is necessary because
  // interactive tools like Claude Code require a real TTY.
  const logDir = mkdtempSync(join(tmpdir(), 'blackbox-'));
  const logFile = join(logDir, 'output.log');

  return new Promise<void>((resolve) => {
    const isMac = process.platform === 'darwin';

    // macOS: script -q <logfile> <shell> -c <cmd>
    // Linux: script -q -c <cmd> <logfile>
    const scriptArgs = isMac
      ? ['-q', logFile, '/bin/sh', '-c', commandStr]
      : ['-q', '-c', commandStr, logFile];

    const child = spawn('script', scriptArgs, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', async (exitCode) => {
      const duration = Date.now() - startTime;

      // Read captured output from the log file
      let rawOutput = '';
      let outputSize = 0;
      try {
        rawOutput = readFileSync(logFile, 'utf-8');
        outputSize = rawOutput.length;
      } catch {
        // Log file may not exist if process was killed immediately
      }

      // Clean up temp file
      try { unlinkSync(logFile); } catch { /* ignore */ }

      const truncatedOutput = rawOutput.length > 100_000
        ? rawOutput.slice(0, 100_000) + '\n... [truncated]'
        : rawOutput;

      appendEvent({
        session_id: session.id,
        type: 'raw_output',
        data: { output: truncatedOutput, output_size: outputSize },
      });

      // If the wrapped command was Claude Code, auto-ingest its session logs
      if (agent === 'claude-code') {
        appendEvent({
          session_id: session.id,
          type: 'session_end',
          data: {
            exit_code: exitCode,
            duration_ms: duration,
            output_size: outputSize,
            note: 'Claude Code session — run `blackbox ingest --all` to import detailed logs',
          },
        });
      } else {
        appendEvent({
          session_id: session.id,
          type: 'session_end',
          data: {
            exit_code: exitCode,
            duration_ms: duration,
            output_size: outputSize,
          },
        });
      }

      // Track file changes
      let fileChanges: FileChange[] = [];
      if (beforeSnapshot) {
        try {
          const afterSnapshot = takeSnapshot(cwd);
          fileChanges = diffSnapshots(beforeSnapshot, afterSnapshot, cwd);
          if (fileChanges.length > 0) {
            storeFileChanges(session.id, fileChanges);
            for (const fc of fileChanges) {
              appendEvent({
                session_id: session.id,
                type: 'file_change',
                data: {
                  file_path: fc.file_path,
                  change_type: fc.change_type,
                  has_diff: !!fc.diff,
                },
              });
            }
          }
        } catch {
          // Non-fatal
        }
      }

      endSession(session.id);

      // Show session summary and micro-annotation prompt
      renderSessionSummary({
        sessionId: session.id,
        durationMs: duration,
        exitCode: exitCode ?? null,
        fileChanges: fileChanges.map(fc => ({ file_path: fc.file_path, change_type: fc.change_type })),
      });

      if (!opts.noPrompt) {
        await promptMicroAnnotation(session.id);
      }

      resolve();
    });

    child.on('error', (err) => {
      appendEvent({
        session_id: session.id,
        type: 'session_end',
        data: {
          error: err.message,
          duration_ms: Date.now() - startTime,
        },
      });

      endSession(session.id);
      resolve();
    });
  });
}

function detectAgent(command: string): string | undefined {
  if (command.includes('claude') || command.includes('claude-code')) return 'claude-code';
  if (command.includes('aider')) return 'aider';
  if (command.includes('codex')) return 'codex';
  return undefined;
}
