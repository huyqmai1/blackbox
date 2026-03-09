import { Command } from 'commander';
import chalk from 'chalk';
import { enrichAllTitles, enrichSessionTitle } from '../analysis/title-generator.js';
import { autoAnnotateAll, autoAnnotateSession } from '../analysis/auto-annotate.js';
import { applyAiEnrichment } from '../analysis/ai-enrich.js';
import { getDb } from '../storage/db.js';
import { resolveSessionId } from '../utils/resolve-session.js';

export const enrichCommand = new Command('enrich')
  .description('Generate titles and auto-annotations for sessions')
  .option('--session <id>', 'Enrich a specific session')
  .option('--titles', 'Only generate titles')
  .option('--annotations', 'Only run auto-annotations')
  .option('--ai', 'Use Claude Code to generate richer titles and annotations')
  .option('--force', 'Re-process sessions that already have titles/annotations')
  .option('--concurrency <n>', 'Max concurrent AI calls (default: 3)', '3')
  .action(async (options: {
    session?: string;
    titles?: boolean;
    annotations?: boolean;
    ai?: boolean;
    force?: boolean;
    concurrency?: string;
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
      const db = getDb();
      const concurrency = parseInt(options.concurrency || '3', 10);
      const condition = options.force ? '' : ' WHERE title IS NULL';
      const sessions = db.prepare(`SELECT id FROM sessions${condition}`).all() as Array<{ id: string }>;

      if (sessions.length === 0) {
        console.log(chalk.dim('All sessions already enriched. Use --force to re-process.'));
        return;
      }

      console.log(chalk.yellow(`AI enriching ${sessions.length} session(s) (concurrency: ${concurrency})...`));
      let done = 0;
      let errors = 0;

      // Process in batches
      for (let i = 0; i < sessions.length; i += concurrency) {
        const batch = sessions.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map(async (s) => {
            try {
              const result = applyAiEnrichment(s.id);
              done++;
              process.stdout.write(`\r  ${chalk.green(done + '/' + sessions.length)} enriched, ${chalk.red(errors + '')} errors`);
              return result;
            } catch {
              errors++;
              process.stdout.write(`\r  ${chalk.green(done + '/' + sessions.length)} enriched, ${chalk.red(errors + '')} errors`);
              // Fall back to heuristic title
              enrichSessionTitle(s.id);
              autoAnnotateSession(s.id);
              throw new Error('AI failed');
            }
          })
        );
      }

      console.log();
      console.log(chalk.green(`Done. ${done} AI-enriched, ${errors} fell back to heuristics.`));
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
