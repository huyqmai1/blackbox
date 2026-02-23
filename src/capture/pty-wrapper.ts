import { spawn } from 'node:child_process';
import { createSession, endSession } from '../storage/sessions.js';
import { appendEvent } from '../storage/events.js';

export interface ExecOptions {
  command: string[];
  cwd?: string;
  name?: string;
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

  const startTime = Date.now();
  let outputSize = 0;
  const outputChunks: string[] = [];

  return new Promise<void>((resolve) => {
    const userShell = process.env.SHELL || '/bin/sh';
    const child = spawn(userShell, ['-c', commandStr], {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env,
    });

    child.stdout?.on('data', (data: Buffer) => {
      const str = data.toString();
      process.stdout.write(str);
      outputSize += str.length;
      outputChunks.push(str);
    });

    child.stderr?.on('data', (data: Buffer) => {
      const str = data.toString();
      process.stderr.write(str);
      outputSize += str.length;
      outputChunks.push(str);
    });

    child.on('close', (exitCode) => {
      const duration = Date.now() - startTime;

      // Store raw output as an event (truncated for very large outputs)
      const rawOutput = outputChunks.join('');
      const truncatedOutput = rawOutput.length > 100_000
        ? rawOutput.slice(0, 100_000) + '\n... [truncated]'
        : rawOutput;

      appendEvent({
        session_id: session.id,
        type: 'raw_output',
        data: { output: truncatedOutput, output_size: outputSize },
      });

      // Record session end
      appendEvent({
        session_id: session.id,
        type: 'session_end',
        data: {
          exit_code: exitCode,
          duration_ms: duration,
          output_size: outputSize,
        },
      });

      endSession(session.id);

      resolve();
    });

    child.on('error', (err) => {
      appendEvent({
        session_id: session.id,
        type: 'session_end',
        data: {
          error: err.message,
          duration_ms: Date.now() - startTime,
          output_size: outputSize,
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
