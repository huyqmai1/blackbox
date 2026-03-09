import { getSession, listSessions } from '../storage/sessions.js';

export function resolveSessionId(prefix?: string): string | undefined {
  if (!prefix) {
    // Default to most recent session
    const sessions = listSessions({ limit: 1 });
    return sessions[0]?.id;
  }

  // Try exact match first
  const exact = getSession(prefix);
  if (exact) return exact.id;

  // Prefix match
  const sessions = listSessions({ limit: 100 });
  const match = sessions.find(s => s.id.startsWith(prefix));
  return match?.id;
}
