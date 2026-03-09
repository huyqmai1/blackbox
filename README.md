# BlackBox

A dashcam for AI-assisted work — passive decision log for AI agent sessions.

BlackBox captures, stores, and visualizes everything that happens during AI coding sessions: prompts, responses, tool calls, file changes, and architectural decisions. It turns the invisible work of AI-assisted development into a browsable, searchable, annotated audit trail.

## Installation

Requires **Node.js >= 20**.

```bash
git clone <repo-url> && cd blackbox
npm install
npm run build
npm link   # makes `blackbox` available globally
```

## Quick Start

```bash
# Import your Claude Code sessions
blackbox ingest

# Launch the web dashboard
blackbox dashboard

# Or wrap a live session to capture it
blackbox exec -- claude-code
```

## How It Works

### Data Model

BlackBox stores everything in a local SQLite database at `~/.blackbox/blackbox.db`. The schema has four tables:

- **sessions** — One record per coding session (ID, source, agent, working directory, git branch, timestamps, title)
- **events** — Immutable log of everything that happened (user prompts, AI responses, tool calls, tool results, file changes)
- **annotations** — Flags and notes attached to sessions or individual events (manual, auto-generated, or AI-generated)
- **file_changes** — Git diffs captured during sessions (file path, change type, full diff content)

Every event and annotation is cryptographically hash-chained: each record includes a SHA-256 hash computed from the previous hash plus its own content. This creates a tamper-evident audit trail — any modification to historical records breaks the chain.

### Ingest Pipeline

BlackBox discovers Claude Code session logs from `~/.claude/projects/<project>/<session-id>.jsonl` and transforms them into structured data:

1. **Discovery** — Scans the Claude projects directory for `.jsonl` files, optionally filtered by modification time
2. **Parsing** — Reads each JSONL file line by line, mapping Claude Code entry types to BlackBox events:
   - `user` entries → `user_prompt` events
   - `assistant` entries → `ai_response` + `tool_use` + `tool_result` events (one per content block)
   - Noisy internal types (`queue-operation`, `lock_acquired`, `progress`, etc.) are skipped
3. **Session creation** — Extracts metadata (project slug, working directory, model, timestamps) and creates a session record
4. **Enrichment on import** — Automatically runs heuristic title generation and auto-annotation rules on each imported session
5. **Deduplication** — Tracks sessions by source ID to avoid re-importing; modified sessions are re-imported with updated events

The ingest pipeline also filters out "enrichment sessions" — JSONL files created by BlackBox's own AI enrichment calls — to prevent feedback loops.

### Enrichment

BlackBox has a two-tier enrichment system for adding context to sessions:

**Heuristic enrichment** (no API key needed):
- **Title generation** — Extracts titles from the first meaningful user prompt: plan titles (`# Heading`), short prompts used verbatim, or first-sentence extraction with smart truncation
- **Auto-annotation** — Rule-based detection of notable patterns:
  - Dangerous commands (`rm -rf`, `git reset --hard`, `git push --force`, `sudo`, `DROP TABLE`, etc.)
  - Error-retry loops (failed tool call followed by retry within 5 events)
  - Large batch edits (10+ files modified in one session)
  - Plan execution (detects plan titles in opening prompts)

**AI enrichment** (requires Anthropic API key):
- Uses Claude Haiku to analyze session transcripts
- Generates descriptive titles (3-8 words), summaries, and annotations referencing specific events
- Annotations identify architectural decisions, risks taken, and notable patterns
- Batch mode: sends multiple sessions in one API call for efficiency
- Concurrent processing with configurable batch size and concurrency
- Change detection: tracks an `enriched_hash` so sessions are only re-enriched when their events change

### Live Capture

The `exec` command wraps any AI agent command in a PTY (pseudo-terminal) to capture its full output:

1. Creates a new session record
2. Takes a git snapshot of the working directory (before)
3. Spawns the command via the system `script` utility for real terminal passthrough
4. On exit: captures raw output, takes another git snapshot, diffs the two to detect file changes
5. Prompts for a quick micro-annotation (optional): "shipped under pressure", "not confident", "manager skipped review", or a custom note

### Web Dashboard

A zero-dependency HTTP server (`node:http`) with embedded HTML, CSS, and JavaScript. No build step, no framework — just `blackbox dashboard`.

**Pages:**
- **Sessions** — Filterable, sortable list of all sessions with event counts and titles
- **Session Detail** — Full event timeline with expandable content, inline annotations (including AI-generated flags on specific events), file changes sidebar, and manual annotation form
- **Projects** — Sessions grouped by project with aggregated stats (session count, events, total duration)
- **Plans** — Claude Code implementation plans discovered from `~/.claude/plans/`, linked to their source sessions
- **Search** — Full-text AND search across all event content
- **Stats** — Aggregate metrics, event type breakdowns, and a daily activity chart
- **Annotations** — Browse all annotations with type filtering

**Dashboard controls:**
- **Sync** — Import/re-import sessions from Claude Code on demand, with auto-sync scheduling (configurable interval)
- **AI Enrichment** — Enrich All, Force All (re-enrich everything), or enrich individual sessions. Shows progress, error messages, and API key input when no key is configured

## CLI Reference

```bash
# Session management
blackbox sessions                          # List sessions (default: last 20)
blackbox sessions --since 2025-01-01       # Filter by date
blackbox sessions --limit 50              # Adjust limit

# Timeline
blackbox timeline                          # Last 24 hours of events
blackbox timeline --session <id>           # Specific session (prefix match)
blackbox timeline --since 7d               # Last 7 days (supports: 24h, 7d, 1w, 1m)
blackbox timeline --type tool_use          # Filter by event type
blackbox timeline --search "migration"     # Search event content
blackbox timeline --expand                 # Show full event details

# Session status
blackbox status                            # Most recent session
blackbox status --session <id>             # Specific session

# Import
blackbox ingest                            # Import all Claude Code sessions
blackbox ingest --since 2025-01-01         # Import sessions after date
blackbox ingest --session <id>             # Import specific session
blackbox ingest --all                      # Force re-import all

# Annotations
blackbox annotate "note" --type decision_note
blackbox annotate "risk" --type risk_flag --session <id>
blackbox annotate "msg" --type constraint_note --tags "security,review"

# Enrichment
blackbox enrich --titles                   # Heuristic titles for all sessions
blackbox enrich --annotations              # Heuristic auto-annotations
blackbox enrich --ai                       # AI enrichment (requires API key)
blackbox enrich --ai --session <id>        # Enrich specific session
blackbox enrich --ai --force               # Re-enrich all sessions

# Live capture
blackbox exec -- claude-code               # Wrap a command
blackbox exec --name "feature" -- aider    # With session name
blackbox exec --cwd /path/to/project -- claude-code

# Configuration
blackbox config set anthropic_api_key sk-ant-...
blackbox config get anthropic_api_key

# Dashboard
blackbox dashboard                         # Start at http://localhost:3333
blackbox dashboard --port 4000             # Custom port
blackbox dashboard --no-open               # Don't auto-open browser
```

## Configuration

BlackBox stores configuration in `~/.blackbox/config.json`. Currently used for:

- `anthropic_api_key` — API key for AI enrichment (alternatively, set `ANTHROPIC_API_KEY` environment variable)

## Development

```bash
npm run dev -- dashboard           # Run without building
npm run dev -- ingest              # Run ingest directly
npm test                           # Run tests (vitest)
npm run build                      # Production build (tsup)
```

### Project Structure

```
src/
  commands/       CLI command definitions (commander.js)
  storage/        SQLite schema, event/annotation/file_change persistence, hash chain
  ingest/         Claude Code JSONL discovery, parsing, session import
  analysis/       Title generation, auto-annotation rules, AI enrichment
  capture/        PTY wrapper for live session capture, file tracking
  dashboard/      HTTP server, API handlers, page templates, embedded assets
  utils/          Configuration persistence
```

### Dependencies

- `better-sqlite3` — Synchronous SQLite driver
- `@anthropic-ai/sdk` — Claude API for AI enrichment
- `commander` — CLI argument parsing
- `chalk` — Terminal colors
- `cli-table3` — ASCII table formatting

## License

MIT
