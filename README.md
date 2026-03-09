# BlackBox

A dashcam for AI-assisted work — passive decision log for AI agent sessions.

BlackBox captures, stores, and visualizes everything that happens during AI agent sessions: prompts, responses, tool calls, file changes, and plans. It provides both a CLI and a web dashboard for browsing session history.

## Installation

Requires **Node.js >= 20**.

```bash
# Clone and install
git clone <repo-url> && cd blackbox
npm install

# Build
npm run build

# Link globally (optional, makes `blackbox` available everywhere)
npm link
```

## Usage

### Ingest Claude Code sessions

BlackBox can import session logs from Claude Code (`~/.claude/projects/`):

```bash
blackbox ingest                    # Import all discovered sessions
blackbox ingest --since 2025-01-01 # Import sessions after a date
```

### CLI commands

```bash
blackbox sessions                  # List all captured sessions
blackbox sessions --limit 10       # Show last 10 sessions
blackbox timeline                  # View event timeline (last 24h)
blackbox timeline --session <id>   # Timeline for a specific session
blackbox timeline --expand         # Show full event details
blackbox status                    # Stats for the most recent session
blackbox status --session <id>     # Stats for a specific session
blackbox annotate "note" --type decision_note   # Add an annotation
blackbox annotate "risk" --type risk_flag --session <id>
```

### Wrap a command

Capture a live AI agent session by wrapping its command:

```bash
blackbox exec -- claude-code       # Wrap any command
blackbox exec --name "my task" -- aider
```

### Web dashboard

```bash
blackbox dashboard                 # Start at http://localhost:3333
blackbox dashboard --port 4000     # Custom port
blackbox dashboard --no-open       # Don't auto-open browser
```

The dashboard provides:

- **Sessions** — browse all sessions with sorting, filtering, and pagination
- **Session detail** — full event timeline with expandable events, inline annotations, and plan content
- **Projects** — sessions grouped by project
- **Plans** — Claude Code plans with actual titles, linked to source sessions
- **Search** — multi-word AND search across all event content
- **Stats** — aggregate counts, event breakdowns, and daily activity

The dashboard includes a **Sync** button to import/re-import sessions from Claude Code on demand.

## Development

```bash
npm run dev -- dashboard           # Run dashboard without building
npm run dev -- ingest              # Run ingest without building
npm run test                       # Run tests
npm run build                      # Production build
```

## Architecture

- **Storage**: SQLite via `better-sqlite3` (stored in `~/.blackbox/blackbox.db`)
- **Dashboard**: Zero-dependency HTTP server (`node:http`) with embedded HTML/CSS/JS
- **Ingest**: Parses Claude Code JSONL session files into structured events
- **Hash chain**: Every event is cryptographically chained for tamper evidence

## License

MIT
