import { Command } from 'commander';
import chalk from 'chalk';
import { createAnnotation, ANNOTATION_TYPES, type AnnotationType } from '../storage/annotations.js';
import { resolveSessionId } from '../utils/resolve-session.js';

const TYPE_COLORS: Record<string, (s: string) => string> = {
  risk_flag: chalk.red,
  decision_note: chalk.yellow,
  override_record: chalk.magenta,
  constraint_note: chalk.blue,
};

export const annotateCommand = new Command('annotate')
  .description('Add an annotation to a session (risk flag, decision note, override record, constraint note)')
  .argument('<message>', 'Annotation message')
  .requiredOption('--type <type>', `Annotation type: ${ANNOTATION_TYPES.join(', ')}`)
  .option('--session <id>', 'Session to annotate (prefix match; defaults to most recent)')
  .option('--tags <tags>', 'Comma-separated tags')
  .action((message: string, options: { type: string; session?: string; tags?: string }) => {
    if (!ANNOTATION_TYPES.includes(options.type as AnnotationType)) {
      console.error(chalk.red(`Invalid annotation type: ${options.type}`));
      console.error(chalk.dim(`Valid types: ${ANNOTATION_TYPES.join(', ')}`));
      process.exit(1);
    }

    const sessionId = resolveSessionId(options.session);
    if (!sessionId) {
      console.error(chalk.red(
        options.session
          ? `Session not found: ${options.session}`
          : 'No sessions found. Run a session first with `blackbox exec`.'
      ));
      process.exit(1);
    }

    const tags = options.tags?.split(',').map(t => t.trim()).filter(Boolean);

    const annotation = createAnnotation({
      session_id: sessionId,
      type: options.type as AnnotationType,
      content: message,
      tags,
    });

    const colorFn = TYPE_COLORS[options.type] ?? chalk.white;

    console.log();
    console.log(chalk.green('Annotation added.'));
    console.log(`  ${chalk.bold('Type:')}     ${colorFn(options.type)}`);
    console.log(`  ${chalk.bold('Session:')}  ${chalk.cyan(sessionId.slice(0, 8))}`);
    console.log(`  ${chalk.bold('Message:')}  ${message}`);
    if (tags?.length) {
      console.log(`  ${chalk.bold('Tags:')}     ${tags.join(', ')}`);
    }
    console.log(`  ${chalk.bold('Hash:')}     ${chalk.dim(annotation.hash.slice(0, 12))}...`);
    console.log();
  });
