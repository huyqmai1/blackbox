import { Command } from 'commander';
import { startServer } from '../dashboard/server.js';

export const dashboardCommand = new Command('dashboard')
  .description('Launch the web dashboard to browse sessions, events, and stats')
  .option('-p, --port <port>', 'Port to listen on', '3333')
  .option('--no-open', 'Do not auto-open the browser')
  .action((opts) => {
    const port = parseInt(opts.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Invalid port number:', opts.port);
      process.exit(1);
    }
    startServer(port, opts.open);
  });
