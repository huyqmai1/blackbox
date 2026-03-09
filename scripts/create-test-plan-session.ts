#!/usr/bin/env npx tsx
// Creates a test session with plan events for dashboard testing

import { createSession } from '../src/storage/sessions.js';
import { appendEvent } from '../src/storage/events.js';
import { getDb } from '../src/storage/db.js';

const now = new Date();
const ts = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60000).toISOString();

const session = createSession({
  source: 'test:plan-demo',
  agent: 'claude-code',
  cwd: '/Users/huy/my-project',
  started_at: ts(-30),
  metadata_json: JSON.stringify({
    project_slug: '-Users-huy-my-project',
    model: 'claude-opus-4-6',
  }),
});

console.log(`Created session: ${session.id}`);

// 1. User prompt
appendEvent({
  session_id: session.id,
  type: 'user_prompt',
  timestamp: ts(-30),
  data: { content: 'Build a REST API for the todo app with authentication and database migrations' },
});

// 2. AI response
appendEvent({
  session_id: session.id,
  type: 'ai_response',
  timestamp: ts(-29),
  data: { content: "I'll create a plan for this. Let me enter plan mode to design the architecture.", model: 'claude-opus-4-6' },
});

// 3. EnterPlanMode
appendEvent({
  session_id: session.id,
  type: 'tool_use',
  timestamp: ts(-28),
  data: {
    tool_name: 'EnterPlanMode',
    tool_input: {},
    tool_id: 'plan-enter-1',
    raw_type: 'assistant',
  },
});

// 4. ExitPlanMode with plan content
appendEvent({
  session_id: session.id,
  type: 'tool_use',
  timestamp: ts(-25),
  data: {
    tool_name: 'ExitPlanMode',
    tool_input: {
      plan: `# Todo App REST API

## Context
Build a full REST API for a todo application with user authentication, database migrations, and proper error handling.

## Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Knex.js for migrations
- **Auth**: JWT-based authentication with bcrypt password hashing

## API Endpoints

### Auth
- \`POST /api/auth/register\` — Create new user account
- \`POST /api/auth/login\` — Login and receive JWT token
- \`POST /api/auth/refresh\` — Refresh JWT token

### Todos
- \`GET /api/todos\` — List all todos for authenticated user
- \`POST /api/todos\` — Create a new todo
- \`PATCH /api/todos/:id\` — Update a todo
- \`DELETE /api/todos/:id\` — Delete a todo

## Database Schema

### users
- id (UUID, primary key)
- email (TEXT, unique)
- password_hash (TEXT)
- created_at (TIMESTAMP)

### todos
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- title (TEXT)
- completed (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Implementation Order
1. Database setup + migrations
2. User model + auth endpoints
3. Auth middleware (JWT verification)
4. Todo model + CRUD endpoints
5. Input validation + error handling
6. Tests`,
    },
    tool_id: 'plan-exit-1',
    raw_type: 'assistant',
  },
});

// 5. Write plan to file
appendEvent({
  session_id: session.id,
  type: 'tool_use',
  timestamp: ts(-24),
  data: {
    tool_name: 'Write',
    tool_input: {
      file_path: '/Users/huy/.claude/plans/test-todo-api-plan.md',
      content: '# Todo App REST API\n\n## Context\nBuild a full REST API...\n',
    },
    tool_id: 'write-plan-1',
    raw_type: 'assistant',
  },
});

// 6. AI continues working
appendEvent({
  session_id: session.id,
  type: 'ai_response',
  timestamp: ts(-23),
  data: { content: "Plan created. Now let me start implementing the database migrations.", model: 'claude-opus-4-6' },
});

// 7. Some tool use
appendEvent({
  session_id: session.id,
  type: 'tool_use',
  timestamp: ts(-22),
  data: {
    tool_name: 'Write',
    tool_input: { file_path: '/Users/huy/my-project/src/db/migrations/001_create_users.ts' },
    tool_id: 'write-1',
    raw_type: 'assistant',
  },
});

// 8. More tool use
appendEvent({
  session_id: session.id,
  type: 'tool_use',
  timestamp: ts(-20),
  data: {
    tool_name: 'Write',
    tool_input: { file_path: '/Users/huy/my-project/src/db/migrations/002_create_todos.ts' },
    tool_id: 'write-2',
    raw_type: 'assistant',
  },
});

// 9. Another user prompt
appendEvent({
  session_id: session.id,
  type: 'user_prompt',
  timestamp: ts(-15),
  data: { content: 'Also add rate limiting to the auth endpoints' },
});

// 10. AI response
appendEvent({
  session_id: session.id,
  type: 'ai_response',
  timestamp: ts(-14),
  data: { content: "Good idea. I'll add rate limiting middleware using express-rate-limit.", model: 'claude-opus-4-6' },
});

// Update session ended_at
const db = getDb();
db.prepare('UPDATE sessions SET ended_at = ?, updated_at = ? WHERE id = ?')
  .run(ts(-10), new Date().toISOString(), session.id);

console.log('Test session with plan events created successfully.');
console.log(`View it at: http://localhost:3333/session/${session.id}`);
