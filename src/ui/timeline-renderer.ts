import chalk from 'chalk';
import type { Event } from '../storage/events.js';
import type { Session } from '../storage/sessions.js';
import type { Annotation } from '../storage/annotations.js';
import { formatDuration } from '../utils/format.js';

const TYPE_COLORS: Record<string, (s: string) => string> = {
  user_prompt: chalk.blue,
  ai_response: chalk.green,
  tool_use: chalk.yellow,
  tool_result: chalk.dim,
  file_change: chalk.magenta,
  session_start: chalk.cyan,
  session_end: chalk.cyan,
  raw_output: chalk.dim,
  risk_flag: chalk.red,
  decision_note: chalk.yellow,
  override_record: chalk.magenta,
  constraint_note: chalk.blue,
};

const TYPE_ICONS: Record<string, string> = {
  user_prompt: '>',
  ai_response: '<',
  tool_use: '$',
  tool_result: '.',
  file_change: '~',
  session_start: '[',
  session_end: ']',
  raw_output: '#',
  risk_flag: '!',
  decision_note: '!',
  override_record: '!',
  constraint_note: '!',
};

export type TimelineItem =
  | { kind: 'event'; data: Event }
  | { kind: 'annotation'; data: Annotation };

export function mergeTimeline(events: Event[], annotations: Annotation[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...events.map(e => ({ kind: 'event' as const, data: e })),
    ...annotations.map(a => ({ kind: 'annotation' as const, data: a })),
  ];
  items.sort((a, b) => {
    const tsA = a.data.timestamp;
    const tsB = b.data.timestamp;
    return tsA.localeCompare(tsB);
  });
  return items;
}

export function renderTimeline(
  items: TimelineItem[],
  options?: { expand?: boolean; sessionMap?: Map<string, Session> },
): void {
  const expand = options?.expand ?? false;
  const sessionMap = options?.sessionMap;
  let currentSessionId: string | null = null;

  for (const item of items) {
    const sessionId = item.data.session_id;

    // Print session header when session changes
    if (sessionId !== currentSessionId) {
      currentSessionId = sessionId;
      const session = currentSessionId ? sessionMap?.get(currentSessionId) : undefined;

      console.log();
      console.log(chalk.bold.underline(
        `Session ${currentSessionId?.slice(0, 8) ?? 'unknown'}` +
        (session?.agent ? ` (${session.agent})` : '') +
        (session?.cwd ? ` — ${session.cwd}` : '')
      ));
      console.log();
    }

    if (item.kind === 'event') {
      renderEvent(item.data, expand);
    } else {
      renderAnnotation(item.data, expand);
    }
  }
}

function renderEvent(event: Event, expand: boolean): void {
  const colorFn = TYPE_COLORS[event.type] ?? chalk.white;
  const icon = TYPE_ICONS[event.type] ?? '?';
  const time = formatTimestamp(event.timestamp);

  const data = parseData(event.data_json);
  const summary = summarizeEvent(event.type, data, expand);

  console.log(
    `  ${chalk.dim(time)}  ${colorFn(icon)} ${colorFn(padType(event.type))}  ${summary}`
  );
}

function renderAnnotation(annotation: Annotation, expand: boolean): void {
  const colorFn = TYPE_COLORS[annotation.type] ?? chalk.red;
  const icon = TYPE_ICONS[annotation.type] ?? '!';
  const time = formatTimestamp(annotation.timestamp);
  const maxLen = expand ? 500 : 120;

  const content = truncate(annotation.content, maxLen);
  const tags = annotation.tags_json ? JSON.parse(annotation.tags_json) as string[] : [];
  const tagStr = tags.length > 0 ? chalk.dim(` [${tags.join(', ')}]`) : '';

  console.log(
    `  ${chalk.dim(time)}  ${colorFn(icon)} ${colorFn(padType(annotation.type))}  ${content}${tagStr}`
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso.slice(11, 19);
  }
}

function padType(type: string): string {
  return type.padEnd(16);
}

function parseData(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function summarizeEvent(type: string, data: Record<string, unknown>, expand: boolean): string {
  const maxLen = expand ? 500 : 120;

  switch (type) {
    case 'user_prompt': {
      const content = String(data.content ?? '');
      return truncate(content, maxLen);
    }
    case 'ai_response': {
      const content = String(data.content ?? '');
      const model = data.model ? chalk.dim(` [${data.model}]`) : '';
      return truncate(content, maxLen) + model;
    }
    case 'tool_use': {
      const name = String(data.tool_name ?? 'unknown');
      const input = data.tool_input;
      let inputStr = '';
      if (input && typeof input === 'object') {
        const keys = Object.keys(input as Record<string, unknown>);
        inputStr = ` (${keys.join(', ')})`;
      }
      return chalk.bold(name) + chalk.dim(truncate(inputStr, maxLen - name.length));
    }
    case 'tool_result': {
      const content = String(data.content ?? '');
      const isError = data.is_error ? chalk.red(' [ERROR]') : '';
      return truncate(content, maxLen) + isError;
    }
    case 'file_change': {
      const filePath = String(data.file_path ?? '');
      const changeType = String(data.change_type ?? 'modified');
      const changeIcon = changeType === 'added' ? '+' : changeType === 'deleted' ? '-' : '~';
      return `${changeIcon} ${filePath}`;
    }
    case 'session_start': {
      const parts: string[] = [];
      if (data.command) parts.push(`cmd: ${data.command}`);
      if (data.cwd) parts.push(`cwd: ${data.cwd}`);
      if (data.source) parts.push(`source: ${data.source}`);
      return chalk.dim(parts.join('  '));
    }
    case 'session_end': {
      const parts: string[] = [];
      if (data.duration_ms != null) parts.push(`duration: ${formatDuration(Number(data.duration_ms))}`);
      if (data.exit_code != null) parts.push(`exit: ${data.exit_code}`);
      if (data.event_count != null) parts.push(`events: ${data.event_count}`);
      return chalk.dim(parts.join('  '));
    }
    case 'raw_output': {
      const size = data.output_size ?? 0;
      return chalk.dim(`[${size} bytes of terminal output]`);
    }
    default: {
      const raw = JSON.stringify(data);
      return chalk.dim(truncate(raw, maxLen));
    }
  }
}

function truncate(s: string, max: number): string {
  const oneLine = s.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max - 3) + '...';
}
