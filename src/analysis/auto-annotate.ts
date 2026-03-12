import { getEvents, type Event } from '../storage/events.js';
import { createAnnotation, type AnnotationType } from '../storage/annotations.js';
import { getDb } from '../storage/db.js';

interface AutoAnnotation {
  event_id: number;
  type: AnnotationType;
  content: string;
  tags: string[];
  timestamp: string;
}

interface AnnotationRule {
  id: string;
  scan(events: Event[]): AutoAnnotation[];
}

// --- Rules ---

const dangerousCommandRule: AnnotationRule = {
  id: 'dangerous-command',
  scan(events) {
    const results: AutoAnnotation[] = [];
    const patterns = [
      { re: /rm\s+(-[^\s]*)?r[^\s]*f|rm\s+(-[^\s]*)?f[^\s]*r/i, label: 'rm -rf' },
      { re: /git\s+reset\s+--hard/i, label: 'git reset --hard' },
      { re: /git\s+push\s+.*--force|git\s+push\s+-f\b/i, label: 'git push --force' },
      { re: /--no-verify/i, label: '--no-verify (skipped hooks)' },
      { re: /\bsudo\s/i, label: 'sudo' },
      { re: /chmod\s+777/i, label: 'chmod 777' },
      { re: /DROP\s+TABLE|DROP\s+DATABASE/i, label: 'DROP TABLE/DATABASE' },
      { re: /git\s+clean\s+-[^\s]*f/i, label: 'git clean -f' },
    ];

    const SHELL_TOOLS = new Set(['Bash', 'bash', 'shell', 'Shell', 'terminal', 'Terminal', 'execute', 'exec', 'run_command']);
    for (const ev of events) {
      if (ev.type !== 'tool_use') continue;
      try {
        const data = JSON.parse(ev.data_json);
        if (!SHELL_TOOLS.has(data.tool_name)) continue;
        const cmd = String(data.tool_input?.command || '');
        for (const p of patterns) {
          if (p.re.test(cmd)) {
            results.push({
              event_id: ev.id,
              type: 'risk_flag',
              content: `Dangerous command: ${p.label}`,
              tags: ['auto', `auto:${this.id}`],
              timestamp: ev.timestamp,
            });
            break; // one flag per event
          }
        }
      } catch { /* skip */ }
    }
    return results;
  },
};

const errorRetryRule: AnnotationRule = {
  id: 'error-retry',
  scan(events) {
    const results: AutoAnnotation[] = [];
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.type !== 'tool_result') continue;
      try {
        const data = JSON.parse(ev.data_json);
        if (!data.is_error) continue;

        // Look ahead for retry (same tool called again within next 5 events)
        const errorContent = String(data.content || '').slice(0, 100);
        for (let j = i + 1; j < Math.min(i + 6, events.length); j++) {
          if (events[j].type === 'tool_use') {
            results.push({
              event_id: ev.id,
              type: 'risk_flag',
              content: `Error encountered and retried: ${errorContent}`,
              tags: ['auto', `auto:${this.id}`],
              timestamp: ev.timestamp,
            });
            break;
          }
        }
      } catch { /* skip */ }
    }
    return results;
  },
};

const largeBatchRule: AnnotationRule = {
  id: 'large-batch-edit',
  scan(events) {
    const files = new Set<string>();
    for (const ev of events) {
      if (ev.type !== 'tool_use') continue;
      try {
        const data = JSON.parse(ev.data_json);
        if (['Write', 'Edit'].includes(data.tool_name) && data.tool_input?.file_path) {
          files.add(data.tool_input.file_path);
        }
      } catch { /* skip */ }
    }

    if (files.size >= 10) {
      // Attach to the last tool_use event
      const lastToolUse = events.filter(e => e.type === 'tool_use').pop();
      if (lastToolUse) {
        return [{
          event_id: lastToolUse.id,
          type: 'decision_note' as AnnotationType,
          content: `Large batch edit: ${files.size} files modified in this session`,
          tags: ['auto', 'auto:large-batch-edit'],
          timestamp: lastToolUse.timestamp,
        }];
      }
    }
    return [];
  },
};

const planExecutionRule: AnnotationRule = {
  id: 'plan-execution',
  scan(events) {
    const firstPrompt = events.find(e => e.type === 'user_prompt');
    if (!firstPrompt) return [];
    try {
      const data = JSON.parse(firstPrompt.data_json);
      const content = String(data.content || '');
      const planMatch = content.match(/(?:implement|follow|execute).*plan[:\s]*\n+#\s+(.+)/i);
      if (planMatch) {
        return [{
          event_id: firstPrompt.id,
          type: 'decision_note' as AnnotationType,
          content: `Plan execution: ${planMatch[1].trim()}`,
          tags: ['auto', 'auto:plan-execution'],
          timestamp: firstPrompt.timestamp,
        }];
      }
    } catch { /* skip */ }
    return [];
  },
};

const ALL_RULES: AnnotationRule[] = [
  dangerousCommandRule,
  errorRetryRule,
  largeBatchRule,
  planExecutionRule,
];

// --- Main ---

export function autoAnnotateSession(sessionId: string): number {
  const events = getEvents({ session_id: sessionId });
  if (events.length === 0) return 0;

  // Clear existing auto-annotations for this session
  deleteAutoAnnotations(sessionId);

  let count = 0;
  for (const rule of ALL_RULES) {
    const annotations = rule.scan(events);
    for (const ann of annotations) {
      createAnnotation({
        session_id: sessionId,
        event_id: ann.event_id,
        type: ann.type,
        content: ann.content,
        tags: ann.tags,
        timestamp: ann.timestamp,
      });
      count++;
    }
  }
  return count;
}

export function autoAnnotateAll(force = false): { sessions: number; annotations: number } {
  const db = getDb();
  let sessions: Array<{ id: string }>;

  if (force) {
    sessions = db.prepare('SELECT id FROM sessions').all() as Array<{ id: string }>;
  } else {
    // Only sessions with no auto-annotations yet
    sessions = db.prepare(`
      SELECT s.id FROM sessions s
      WHERE NOT EXISTS (
        SELECT 1 FROM annotations a
        WHERE a.session_id = s.id AND a.tags_json LIKE '%"auto"%'
      )
    `).all() as Array<{ id: string }>;
  }

  let totalAnnotations = 0;
  for (const s of sessions) {
    totalAnnotations += autoAnnotateSession(s.id);
  }
  return { sessions: sessions.length, annotations: totalAnnotations };
}

function deleteAutoAnnotations(sessionId: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM annotations WHERE session_id = ? AND tags_json LIKE '%"auto"%'`).run(sessionId);
}
