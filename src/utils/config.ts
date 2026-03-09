import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BLACKBOX_DIR = process.env.BLACKBOX_DIR ?? join(homedir(), '.blackbox');
const CONFIG_PATH = join(BLACKBOX_DIR, 'config.json');

interface BlackboxConfig {
  anthropic_api_key?: string;
  [key: string]: unknown;
}

export function getConfig(): BlackboxConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function setConfig(updates: Partial<BlackboxConfig>): void {
  const config = getConfig();
  Object.assign(config, updates);
  mkdirSync(BLACKBOX_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || getConfig().anthropic_api_key || undefined;
}
