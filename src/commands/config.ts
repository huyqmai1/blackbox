import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, setConfig } from '../utils/config.js';

export const configCommand = new Command('config')
  .description('Manage blackbox configuration');

configCommand
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action((key: string, value: string) => {
    setConfig({ [key]: value });
    const display = key.toLowerCase().includes('key') ? value.slice(0, 8) + '...' : value;
    console.log(chalk.green(`Set ${key} = ${display}`));
  });

configCommand
  .command('get <key>')
  .description('Get a configuration value')
  .action((key: string) => {
    const config = getConfig();
    const value = config[key];
    if (value === undefined) {
      console.log(chalk.dim('(not set)'));
    } else {
      const display = key.toLowerCase().includes('key') ? String(value).slice(0, 8) + '...' : String(value);
      console.log(display);
    }
  });
