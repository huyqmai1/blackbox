import { getEvents } from '../storage/events.js';
import { getDb } from '../storage/db.js';

// Noise patterns to skip when finding the first real user prompt
const NOISE_PATTERNS = [
  /^<command-name>/,
  /^<local-command-caveat>/,
  /^<task-notification>/,
  /^\[Request interrupted/,
  /^\/\w+/,          // slash commands like /clear, /login
  /^\s*$/,           // empty or whitespace
  /^\x1b\[/,         // ANSI escape sequences
  /^Set model to/i,  // model switch messages
  /^(Goodbye|See ya|Bye|Login successful|Logged in)/i, // greetings/auth
];

export function generateTitle(sessionId: string): string {
  const events = getEvents({ session_id: sessionId, type: 'user_prompt', limit: 5 });

  for (const ev of events) {
    try {
      const data = JSON.parse(ev.data_json);
      const content = String(data.content || '')
        .replace(/\x1b\[[0-9;]*m/g, '') // strip ANSI codes
        .trim();
      if (!content) continue;

      // Skip noise
      if (NOISE_PATTERNS.some(p => p.test(content))) continue;

      return extractTitle(content);
    } catch { continue; }
  }

  // Fallback: use project name from session metadata
  const db = getDb();
  const session = db.prepare('SELECT metadata_json, cwd FROM sessions WHERE id = ?').get(sessionId) as
    { metadata_json: string | null; cwd: string | null } | undefined;

  if (session) {
    const meta = session.metadata_json ? JSON.parse(session.metadata_json) : {};
    const slug = meta.project_slug || '';
    if (slug) {
      const cleaned = slug.replace(/^-Users-[^-]+-/, '');
      return `Session in ${cleaned || slug}`;
    }
    if (session.cwd) {
      const parts = session.cwd.split('/');
      return `Session in ${parts[parts.length - 1]}`;
    }
  }

  return 'Untitled session';
}

function extractTitle(content: string): string {
  // 1. Plan title: "Implement the following plan:\n\n# Title"
  const planMatch = content.match(/(?:implement|follow|execute).*plan[:\s]*\n+#\s+(.+)/i);
  if (planMatch) return truncateAtWord(planMatch[1].trim(), 80);

  // 2. Any markdown heading in the content
  const headingMatch = content.match(/^#+\s+(.+)/m);
  if (headingMatch) return truncateAtWord(headingMatch[1].trim(), 80);

  // 3. Short prompt — use as-is
  const cleaned = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 60) return cleaned;

  // 4. First sentence
  const sentenceMatch = cleaned.match(/^(.+?)[.\n]/);
  if (sentenceMatch && sentenceMatch[1].length >= 10) {
    return truncateAtWord(sentenceMatch[1].trim(), 80);
  }

  // 5. Truncate at word boundary
  return truncateAtWord(cleaned, 80);
}

function truncateAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.6) return cut.slice(0, lastSpace) + '...';
  return cut + '...';
}

export function enrichSessionTitle(sessionId: string): void {
  const title = generateTitle(sessionId);
  const db = getDb();
  db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, sessionId);
}

export function enrichAllTitles(force = false): number {
  const db = getDb();
  const condition = force ? '' : ' WHERE title IS NULL';
  const sessions = db.prepare(`SELECT id FROM sessions${condition}`).all() as Array<{ id: string }>;

  for (const s of sessions) {
    enrichSessionTitle(s.id);
  }
  return sessions.length;
}
