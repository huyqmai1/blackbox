import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BLACKBOX_DIR = process.env.BLACKBOX_DIR ?? join(homedir(), '.blackbox');
const CONFIG_PATH = join(BLACKBOX_DIR, 'config.json');

interface BlackboxConfig {
  anthropic_api_key?: string;
  openai_api_key?: string;
  model?: string;
  [key: string]: unknown;
}

export const SUPPORTED_MODELS = {
  anthropic: [
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
  ],
  openai: [
    'gpt-4o-mini',
    'gpt-4o',
    'o3-mini',
  ],
} as const;

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

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || getConfig().openai_api_key || undefined;
}

export function getModel(): string {
  return getConfig().model || 'claude-haiku-4-5-20251001';
}

export function getProviderFromModel(model: string): 'anthropic' | 'openai' {
  return model.startsWith('claude-') ? 'anthropic' : 'openai';
}

export function getApiKeyForModel(model: string): string | undefined {
  return getProviderFromModel(model) === 'anthropic' ? getApiKey() : getOpenAiApiKey();
}
