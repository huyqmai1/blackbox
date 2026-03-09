import chalk from 'chalk';
import { createInterface } from 'node:readline';
import { getEventCountsByType } from '../storage/events.js';
import { createAnnotation, getAnnotationCountBySession, type AnnotationType } from '../storage/annotations.js';
import { formatDuration } from '../utils/format.js';

export interface SessionSummaryData {
  sessionId: string;
  durationMs: number;
  exitCode: number | null;
  fileChanges?: Array<{ file_path: string; change_type: string }>;
}

export function renderSessionSummary(data: SessionSummaryData): void {
  const counts = getEventCountsByType(data.sessionId);
  const totalEvents = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log();
  console.log(chalk.bold('Session Summary'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log(`  ${chalk.bold('Session:')}    ${chalk.cyan(data.sessionId.slice(0, 8))}`);
  console.log(`  ${chalk.bold('Duration:')}   ${formatDuration(data.durationMs)}`);
  console.log(`  ${chalk.bold('Events:')}     ${totalEvents}`);

  if (counts.user_prompt) {
    console.log(`  ${chalk.bold('Prompts:')}    ${counts.user_prompt}`);
  }
  if (counts.ai_response) {
    console.log(`  ${chalk.bold('Responses:')}  ${counts.ai_response}`);
  }

  if (data.fileChanges && data.fileChanges.length > 0) {
    console.log(`  ${chalk.bold('Files:')}      ${data.fileChanges.length} file(s) changed`);
    for (const fc of data.fileChanges.slice(0, 5)) {
      const changeIcon = fc.change_type === 'added' ? '+' : fc.change_type === 'deleted' ? '-' : '~';
      console.log(`    ${chalk.dim(changeIcon)} ${fc.file_path}`);
    }
    if (data.fileChanges.length > 5) {
      console.log(chalk.dim(`    ... and ${data.fileChanges.length - 5} more`));
    }
  }

  const annotationCount = getAnnotationCountBySession(data.sessionId);
  if (annotationCount > 0) {
    console.log(`  ${chalk.bold('Annotations:')} ${annotationCount}`);
  }
  console.log();
}

const QUICK_ANNOTATIONS: Array<{ label: string; type: AnnotationType; content: string }> = [
  { label: 'Shipped under time pressure', type: 'constraint_note', content: 'Shipped under time pressure' },
  { label: "Wasn't confident in output", type: 'risk_flag', content: 'Not confident in AI output quality' },
  { label: 'Manager asked me to skip review', type: 'override_record', content: 'Skipped review at management request' },
  { label: 'Custom note...', type: 'decision_note', content: '' },
];

export async function promptMicroAnnotation(sessionId: string): Promise<void> {
  // Only prompt if stdin is a TTY
  if (!process.stdin.isTTY || !process.stdout.isTTY) return;

  console.log(chalk.bold('Anything to flag about this session?'));
  console.log(chalk.dim('(press Enter to skip)'));
  console.log();

  for (let i = 0; i < QUICK_ANNOTATIONS.length; i++) {
    console.log(`  ${chalk.cyan(String(i + 1))}. ${QUICK_ANNOTATIONS[i].label}`);
  }
  console.log();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    rl.question(chalk.dim('  Choice (1-4, or Enter to skip): '), (answer) => {
      const trimmed = answer.trim();

      if (!trimmed) {
        rl.close();
        resolve();
        return;
      }

      const choice = parseInt(trimmed, 10);
      if (isNaN(choice) || choice < 1 || choice > QUICK_ANNOTATIONS.length) {
        // Treat free-form text as a custom annotation
        createAnnotation({
          session_id: sessionId,
          type: 'decision_note',
          content: trimmed,
        });
        console.log(chalk.green('  Noted.'));
        rl.close();
        resolve();
        return;
      }

      const selected = QUICK_ANNOTATIONS[choice - 1];

      if (selected.content === '') {
        // Custom note — prompt for text
        rl.question(chalk.dim('  Note: '), (note) => {
          if (note.trim()) {
            createAnnotation({
              session_id: sessionId,
              type: selected.type,
              content: note.trim(),
            });
            console.log(chalk.green('  Noted.'));
          }
          rl.close();
          resolve();
        });
        return;
      }

      createAnnotation({
        session_id: sessionId,
        type: selected.type,
        content: selected.content,
      });
      console.log(chalk.green('  Noted.'));
      rl.close();
      resolve();
    });
  });
}
