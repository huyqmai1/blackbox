import { Command } from 'commander';
import chalk from 'chalk';
import { enrichAllTitles, enrichSessionTitle } from '../analysis/title-generator.js';
import { autoAnnotateAll, autoAnnotateSession } from '../analysis/auto-annotate.js';
import { applyAiEnrichment, aiEnrichAll } from '../analysis/ai-enrich.js';
import { getDb } from '../storage/db.js';
import { resolveSessionId } from '../utils/resolve-session.js';

export const enrichCommand = new Command('enrich')
  .description('Generate titles and auto-annotations for sessions')
  .option('--session <id>', 'Enrich a specific session')
  .option('--titles', 'Only generate titles')
  .option('--annotations', 'Only run auto-annotations')
  .option('--ai', 'Use Claude Code to generate richer titles and annotations')
  .option('--force', 'Re-process sessions that already have titles/annotations')
  .option('--concurrency <n>', 'Max concurrent AI batch calls (default: 3)', '3')
  .option('--batch-size <n>', 'Sessions per AI batch call (default: 10)', '10')
  .action(async (options: {
    session?: string;
    titles?: boolean;
    annotations?: boolean;
    ai?: boolean;
    force?: boolean;
    concurrency?: string;
    batchSize?: string;
  }) => {
    const runTitles = !options.annotations || options.titles;
    const runAnnotations = !options.titles || options.annotations;

    if (options.session) {
      const sessionId = resolveSessionId(options.session);
      if (!sessionId) {
        console.error(chalk.red(`Session not found: ${options.session}`));
        process.exit(1);
      }

      if (options.ai) {
        console.log(chalk.dim(`AI enriching session ${sessionId.slice(0, 8)}...`));
        try {
          const result = applyAiEnrichment(sessionId);
          console.log(`  ${chalk.green('Title:')} ${result.title}`);
          console.log(`  ${chalk.green('Annotations:')} ${result.annotations}`);
        } catch (err) {
          console.error(chalk.red(`AI enrichment failed: ${err instanceof Error ? err.message : err}`));
          process.exit(1);
        }
      } else {
        if (runTitles) {
          enrichSessionTitle(sessionId);
          const db = getDb();
          const row = db.prepare('SELECT title FROM sessions WHERE id = ?').get(sessionId) as { title: string } | undefined;
          console.log(`  ${chalk.green('Title:')} ${row?.title || 'none'}`);
        }
        if (runAnnotations) {
          const count = autoAnnotateSession(sessionId);
          console.log(`  ${chalk.green('Annotations:')} ${count}`);
        }
      }
      return;
    }

    // Batch mode
    if (options.ai) {
      const concurrency = parseInt(options.concurrency || '3', 10);
      const batchSize = parseInt(options.batchSize || '10', 10);

      console.log(chalk.yellow(`AI enriching sessions (batch size: ${batchSize}, concurrency: ${concurrency})...`));

      const startTime = Date.now();
      const result = await aiEnrichAll({
        force: options.force,
        concurrency,
        batchSize,
        onProgress: (done, total, errors) => {
          process.stdout.write(`\r  ${chalk.green(done + '/' + total)} processed, ${chalk.red(errors + '')} errors`);
        },
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log();

      if (result.enriched === 0 && result.errors === 0) {
        console.log(chalk.dim(`All sessions already enriched (${result.skipped} skipped). Use --force to re-process.`));
      } else {
        console.log(chalk.green(`Done in ${elapsed}s. ${result.enriched} AI-enriched, ${result.skipped} skipped, ${result.errors} errors.`));
      }

      // Run heuristic fallback for errored sessions is handled inside aiEnrichAll
      return;
    }

    // Heuristic mode
    if (runTitles) {
      const count = enrichAllTitles(options.force);
      console.log(chalk.green(`Generated titles for ${count} session(s).`));
    }
    if (runAnnotations) {
      const result = autoAnnotateAll(options.force);
      console.log(chalk.green(`Auto-annotated ${result.sessions} session(s) with ${result.annotations} annotation(s).`));
    }
  });
