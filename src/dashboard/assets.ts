// Embedded CSS and JS assets for the web dashboard
// No external dependencies — served as raw strings via node:http

export const CSS = `
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --surface-hover: #1c2129;
  --border: #30363d;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --text-link: #58a6ff;
  --accent: #58a6ff;
  --accent-hover: #79c0ff;
  --danger: #f85149;
  --success: #3fb950;
  --warning: #d29922;
  --purple: #bc8cff;
  --magenta: #f778ba;
  --radius: 6px;
  --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  min-height: 100vh;
  overflow-x: hidden;
}

a { color: var(--text-link); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Nav */
.nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 48px;
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-brand {
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  letter-spacing: -0.5px;
  text-decoration: none;
}
.nav-brand:hover { text-decoration: none; color: var(--text); }
.nav-brand span { color: var(--text-muted); font-weight: 400; }
.nav a {
  color: var(--text-muted);
  font-size: 14px;
  padding: 12px 0;
  border-bottom: 2px solid transparent;
}
.nav a:hover { color: var(--text); text-decoration: none; }
.nav a.active { color: var(--text); border-bottom-color: var(--accent); }

/* Layout */
.container { max-width: 1200px; margin: 0 auto; padding: 24px; overflow: hidden; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 600; }
.page-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }

/* Filters */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}
.filters input, .filters select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 14px;
  font-family: var(--font-sans);
}
.filters input:focus, .filters select:focus {
  outline: none;
  border-color: var(--accent);
}
.filters input::placeholder { color: var(--text-muted); }
.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
}

/* Table */
.table-wrap { overflow-x: auto; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
th.sortable { cursor: pointer; user-select: none; }
th.sortable:hover { color: var(--text); }
th.sort-asc::after { content: ' \\25B2'; font-size: 10px; }
th.sort-desc::after { content: ' \\25BC'; font-size: 10px; }
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
tr:hover td { background: var(--surface-hover); }
.session-id {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-link);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.badge-user_prompt { background: rgba(88,166,255,0.15); color: #58a6ff; }
.badge-ai_response { background: rgba(63,185,80,0.15); color: #3fb950; }
.badge-tool_use { background: rgba(210,153,34,0.15); color: #d29922; }
.badge-tool_result { background: rgba(210,153,34,0.10); color: #c69026; }
.badge-file_change { background: rgba(188,140,255,0.15); color: #bc8cff; }
.badge-risk_flag { background: rgba(248,81,73,0.15); color: #f85149; }
.badge-decision_note { background: rgba(88,166,255,0.15); color: #58a6ff; }
.badge-override_record { background: rgba(247,120,186,0.15); color: #f778ba; }
.badge-constraint_note { background: rgba(210,153,34,0.15); color: #d29922; }
.badge-command { background: rgba(139,148,158,0.15); color: #8b949e; }
.badge-system { background: rgba(139,148,158,0.15); color: #8b949e; }
.badge-error { background: rgba(248,81,73,0.15); color: #f85149; }
.badge-session_start, .badge-session_end { background: rgba(139,148,158,0.10); color: #8b949e; }
.badge-last-prompt { background: rgba(139,148,158,0.10); color: #8b949e; }
.badge-plan { background: rgba(188,140,255,0.15); color: #bc8cff; }

/* Session detail layout */
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
}
@media (max-width: 900px) {
  .detail-layout { grid-template-columns: 1fr; }
}

/* Sidebar */
.sidebar-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
  min-width: 0;
  overflow: hidden;
}
.sidebar-card h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sidebar-card dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 13px; }
.sidebar-card dt { color: var(--text-muted); }
.sidebar-card dd { word-break: break-all; }

/* Timeline */
.timeline { position: relative; }
.timeline-item {
  position: relative;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s;
  min-width: 0;
  overflow: hidden;
}
.timeline-item:hover { border-color: #484f58; }
.timeline-item.expanded { border-color: var(--accent); }
.timeline-item.highlight {
  animation: highlight-pulse 2s ease-out;
}
@keyframes highlight-pulse {
  0% { border-color: var(--accent); box-shadow: 0 0 12px rgba(88,166,255,0.4); }
  100% { border-color: var(--border); box-shadow: none; }
}
.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.timeline-header .time { color: var(--text-muted); font-family: var(--font-mono); font-size: 12px; min-width: 65px; }
.timeline-header .summary { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timeline-body {
  display: none;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.timeline-item.expanded .timeline-body { display: block; }
.timeline-body pre {
  background: var(--bg);
  padding: 12px;
  border-radius: var(--radius);
  font-size: 13px;
  font-family: var(--font-mono);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
  max-height: 500px;
  overflow-y: auto;
}

/* Annotation item in timeline */
.timeline-item.annotation {
  border-left: 3px solid var(--accent);
  background: rgba(88,166,255,0.04);
  overflow: hidden;
}
.timeline-item.annotation .summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.timeline-item.annotation.risk_flag { border-left-color: var(--danger); }
.timeline-item.annotation.decision_note { border-left-color: var(--accent); }
.timeline-item.annotation.override_record { border-left-color: var(--magenta); }
.timeline-item.annotation.constraint_note { border-left-color: var(--warning); }

/* Plan mode banner in timeline */
.timeline-item.plan-mode {
  border-left: 3px solid var(--purple);
  background: rgba(188,140,255,0.06);
}
.plan-link { color: var(--purple); font-weight: 500; }
.timeline-body .plan-content {
  background: var(--bg);
  padding: 16px;
  border-radius: var(--radius);
  font-size: 13px;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;
}
.timeline-body .plan-content h1,
.timeline-body .plan-content h2,
.timeline-body .plan-content h3 {
  margin-top: 16px;
  margin-bottom: 8px;
}
.timeline-body .plan-content h1:first-child,
.timeline-body .plan-content h2:first-child { margin-top: 0; }

/* Event-level annotation button */
.timeline-header .btn-annotate {
  padding: 2px 8px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
  visibility: hidden;
  flex-shrink: 0;
}
.timeline-item:hover .btn-annotate { visibility: visible; }
.btn-annotate:hover { background: var(--surface-hover); color: var(--text); }

/* Inline annotation form */
.inline-ann-form {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  margin-top: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  align-items: flex-start;
}
.inline-ann-form select,
.inline-ann-form input {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 8px;
  border-radius: var(--radius);
  font-size: 12px;
  font-family: var(--font-sans);
}
.inline-ann-form input { flex: 1; }
.inline-ann-form button { padding: 4px 10px; font-size: 12px; }

/* Event-attached annotations */
.event-annotations {
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px solid var(--border);
}
.event-annotation {
  padding: 6px 10px;
  margin-bottom: 4px;
  font-size: 12px;
  background: rgba(88,166,255,0.04);
  border-radius: var(--radius);
  overflow: hidden;
  word-wrap: break-word;
}
.event-annotation.risk_flag { border-left: 2px solid var(--danger); }
.event-annotation.decision_note { border-left: 2px solid var(--accent); }
.event-annotation.override_record { border-left: 2px solid var(--magenta); }
.event-annotation.constraint_note { border-left: 2px solid var(--warning); }

/* Annotation form */
.annotation-form { display: flex; flex-direction: column; gap: 8px; }
.annotation-form select,
.annotation-form textarea,
.annotation-form input {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px;
  border-radius: var(--radius);
  font-family: var(--font-sans);
  font-size: 13px;
}
.annotation-form textarea { resize: vertical; min-height: 60px; }
.annotation-form button { cursor: pointer; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover { background: var(--surface-hover); }
.btn-primary {
  background: var(--accent);
  color: #0d1117;
  border-color: var(--accent);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-success {
  background: var(--success);
  color: #0d1117;
  border-color: var(--success);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
}
.pagination-info { color: var(--text-muted); }
.pagination-controls { display: flex; gap: 4px; align-items: center; }
.pagination-btn { padding: 4px 10px; font-size: 12px; }
.pagination-ellipsis { color: var(--text-muted); padding: 0 4px; }

/* Stat cards */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.stat-card .stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-card .stat-label {
  font-size: 13px;
  color: var(--text-muted);
}

/* Bar chart */
.bar-chart { margin-top: 8px; }
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  padding: 2px 4px;
  border-radius: var(--radius);
}
.bar-row[style*="cursor"] { cursor: pointer; }
.bar-row[style*="cursor"]:hover { background: var(--surface-hover); }
.bar-label { min-width: 100px; color: var(--text-muted); text-align: right; }
.bar-fill {
  height: 20px;
  background: var(--accent);
  border-radius: 3px;
  min-width: 2px;
  transition: width 0.3s;
}
.bar-count { color: var(--text-muted); min-width: 40px; }

/* Activity chart */
.activity-chart { display: flex; align-items: flex-end; gap: 3px; height: 120px; margin-top: 12px; }
.activity-bar {
  flex: 1;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
  min-width: 4px;
  position: relative;
}
.activity-bar:hover { opacity: 0.8; }
.activity-bar:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 10;
}
.activity-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Search */
.search-input {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-sans);
  margin-bottom: 16px;
}
.search-input:focus { outline: none; border-color: var(--accent); }
.search-result {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 8px;
  transition: border-color 0.15s;
}
.search-result.clickable { cursor: pointer; }
.search-result.clickable:hover { border-color: #484f58; }
.search-result .search-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.search-result .search-content {
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Section headers */
.section-header {
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

/* File list */
.file-list { list-style: none; font-size: 13px; }
.file-list li {
  padding: 4px 0;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 6px;
}
.file-list .change-added { color: var(--success); }
.file-list .change-modified { color: var(--warning); }
.file-list .change-deleted { color: var(--danger); }
.file-list .change-renamed { color: var(--purple); }

/* Loading / empty */
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  font-size: 14px;
}

/* Diff view */
.diff-view {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}
.diff-view .diff-add { color: var(--success); }
.diff-view .diff-del { color: var(--danger); }
.diff-view .diff-hunk { color: var(--purple); }

/* Ingest bar */
.ingest-bar {
  display: flex;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 16px;
  font-size: 13px;
  flex-wrap: wrap;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
.ingest-bar:empty { display: none; }
.ingest-bar .ingest-status { flex: 1 1 auto; min-width: 120px; color: var(--text-muted); }
.ingest-bar select, .ingest-bar input { max-width: 100%; min-width: 0; }
.ingest-bar .enrichment-actions { display: flex; gap: 4px; margin-left: auto; flex-shrink: 0; }
.ingest-bar .ingest-pending { color: var(--warning); font-weight: 500; }
.ingest-bar .ingest-ok { color: var(--success); }
.auto-ingest-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}
.auto-ingest-toggle select {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 2px 6px;
  border-radius: var(--radius);
  font-size: 12px;
}

/* Plan content */
.plan-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  font-size: 14px;
  line-height: 1.7;
}
.plan-content h1, .plan-content h2, .plan-content h3 { margin-top: 20px; margin-bottom: 8px; }
.plan-content h1 { font-size: 22px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.plan-content h2 { font-size: 18px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
.plan-content h3 { font-size: 15px; }
.plan-content p { margin-bottom: 8px; }
.plan-content ul, .plan-content ol { margin-left: 20px; margin-bottom: 8px; }
.plan-content li { margin-bottom: 4px; }
.plan-content code {
  background: var(--bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 13px;
}
.plan-content pre {
  background: var(--bg);
  padding: 12px;
  border-radius: var(--radius);
  overflow-x: auto;
  margin-bottom: 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.45;
}
.plan-content pre code { background: none; padding: 0; }
.plan-content hr { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
.plan-content strong { color: var(--text); }
.plan-content a { color: var(--text-link); }
.plan-content blockquote {
  border-left: 3px solid var(--border);
  padding-left: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.plan-content table { border-collapse: collapse; margin-bottom: 12px; }
.plan-content table th, .plan-content table td { border: 1px solid var(--border); padding: 6px 10px; }
`;

export const JS = `
(function() {
  'use strict';

  // ===== Utilities =====

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '\\u2014';
    var d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatDateShort(iso) {
    if (!iso) return '\\u2014';
    var d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatDuration(startIso, endIso) {
    if (!startIso || !endIso) return '\\u2014';
    var ms = new Date(endIso) - new Date(startIso);
    return formatDurationMs(ms);
  }

  function formatDurationMs(ms) {
    if (!ms || ms <= 0) return '\\u2014';
    if (ms < 1000) return ms + 'ms';
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    var rs = s % 60;
    if (m < 60) return m + 'm ' + rs + 's';
    var h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
  }

  function durationMs(startIso, endIso) {
    if (!startIso || !endIso) return 0;
    return new Date(endIso) - new Date(startIso);
  }

  function truncate(str, len) {
    if (!str) return '';
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
  }

  async function apiFetch(url) {
    var res = await fetch(url);
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }

  function cleanProjectName(session) {
    var meta = {};
    try { meta = session.metadata_json ? JSON.parse(session.metadata_json) : {}; } catch(e) {}
    var slug = meta.project_slug || '';
    if (slug) {
      var cleaned = slug.replace(/^-Users-[^-]+-/, '');
      if (cleaned && cleaned !== slug) return cleaned;
      if (slug.startsWith('-')) return slug.slice(1);
      return slug;
    }
    var cwd = meta.cwd || session.cwd || '';
    if (cwd) {
      var parts = cwd.replace(/\\/+$/, '').split('/');
      return parts[parts.length - 1] || cwd;
    }
    return '';
  }

  function extractSummary(event) {
    try {
      var data = JSON.parse(event.data_json);
      if (event.type === 'tool_use' && data.tool_name) {
        var label = data.tool_name;
        // Plan mode events
        if (data.tool_name === 'EnterPlanMode') return '\\u{1F4DD} Entered plan mode';
        if (data.tool_name === 'ExitPlanMode') {
          var planTitle = '';
          if (data.tool_input && data.tool_input.plan) {
            var firstLine = data.tool_input.plan.split('\\n')[0].replace(/^#\\s*/, '').trim();
            if (firstLine) planTitle = ': ' + truncate(firstLine, 80);
          }
          return '\\u{1F4DD} Exited plan mode' + planTitle;
        }
        // Write to plans directory
        if (data.tool_name === 'Write' && data.tool_input && data.tool_input.file_path) {
          var fp = data.tool_input.file_path;
          if (fp.indexOf('.claude/plans/') !== -1) {
            var planFile = fp.split('/').pop().replace('.md', '');
            return '\\u{1F4DD} Wrote plan: ' + planFile;
          }
        }
        if (data.tool_input) {
          if (data.tool_input.command) return label + ': ' + truncate(data.tool_input.command, 100);
          if (data.tool_input.file_path) return label + ': ' + truncate(data.tool_input.file_path, 100);
          if (data.tool_input.pattern) return label + ': ' + truncate(data.tool_input.pattern, 100);
          if (data.tool_input.prompt) return label + ': ' + truncate(data.tool_input.prompt, 80);
          if (data.tool_input.description) return label + ': ' + truncate(data.tool_input.description, 80);
          if (data.tool_input.query) return label + ': ' + truncate(data.tool_input.query, 80);
          return label + ': ' + truncate(JSON.stringify(data.tool_input), 80);
        }
        return label;
      }
      if (event.type === 'user_prompt' && data.content) {
        var clean = String(data.content).replace(/<[^>]+>/g, '').replace(/\\\\s+/g, ' ').trim();
        return truncate(clean, 120);
      }
      if (data.content) return truncate(String(data.content), 120);
      if (data.tool) return 'Tool: ' + data.tool + (data.input ? ' \\u2014 ' + truncate(JSON.stringify(data.input), 80) : '');
      if (data.file_path) return data.change_type + ': ' + data.file_path;
      if (data.command) return '$ ' + truncate(data.command, 100);
      if (data.message) return truncate(String(data.message), 120);
      if (data.text) return truncate(String(data.text), 120);
      return truncate(JSON.stringify(data), 100);
    } catch(e) { return truncate(event.data_json, 100); }
  }

  // Simple markdown to HTML (no deps)
  function renderMarkdown(md) {
    // Process markdown WITHOUT escaping first — we'll handle safety via DOMParser or targeted escaping
    // First, extract code blocks to protect them
    var codeBlocks = [];
    var text = md;
    text = text.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, function(m, code) {
      var idx = codeBlocks.length;
      codeBlocks.push('<pre><code>' + escapeHtml(code.trim()) + '</code></pre>');
      return '%%CODEBLOCK' + idx + '%%';
    });
    text = text.replace(/\`([^\`]+)\`/g, function(m, code) {
      var idx = codeBlocks.length;
      codeBlocks.push('<code>' + escapeHtml(code) + '</code>');
      return '%%CODEBLOCK' + idx + '%%';
    });
    // Now escape the rest
    var html = escapeHtml(text);
    // Restore code blocks
    html = html.replace(/%%CODEBLOCK(\\d+)%%/g, function(m, idx) {
      return codeBlocks[parseInt(idx)];
    });
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold / italic
    html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
    html = html.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
    // HR
    html = html.replace(/^---$/gm, '<hr>');
    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\\/li>\\n?)+/g, '<ul>$&</ul>');
    // Links (already escaped, so match &quot; for quotes if any, but mainly match parens)
    html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
    // Paragraphs (double newline)
    html = html.replace(/\\n\\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    // Clean up empty paragraphs
    html = html.replace(/<p><\\/p>/g, '');
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\\/h[123]>)<\\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\\/pre>)<\\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\\/ul>)<\\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)/g, '$1');
    html = html.replace(/(<hr>)<\\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\\/blockquote>)<\\/p>/g, '$1');
    return html;
  }

  // ===== Page: Sessions List =====

  function initSessionsPage() {
    var container = document.getElementById('sessions-table');
    var filterForm = document.getElementById('sessions-filter');
    if (!container || !filterForm) return;

    var sessionsData = [];
    var sortCol = 'started_at';
    var sortDir = 'desc';
    var currentPage = 1;
    var PAGE_SIZE = 50;

    // Ingest bar
    initIngestBar(function() { load(); });
    // Enrichment bar
    initEnrichmentBar(function() { load(); });

    function renderTable() {
      var filterProject = document.getElementById('filter-project').value;
      var filterTrivial = document.getElementById('filter-trivial').checked;

      var filtered = sessionsData.filter(function(s) {
        if (filterTrivial && (s.event_count || 0) <= 2) return false;
        if (filterProject && cleanProjectName(s) !== filterProject) return false;
        return true;
      });

      filtered.sort(function(a, b) {
        var va, vb;
        if (sortCol === 'started_at') { va = a.started_at || ''; vb = b.started_at || ''; }
        else if (sortCol === 'last_active') { va = a.ended_at || a.started_at || ''; vb = b.ended_at || b.started_at || ''; }
        else if (sortCol === 'duration') { va = durationMs(a.started_at, a.ended_at); vb = durationMs(b.started_at, b.ended_at); }
        else if (sortCol === 'events') { va = a.event_count || 0; vb = b.event_count || 0; }
        else if (sortCol === 'annotations') { va = a.annotation_count || 0; vb = b.annotation_count || 0; }
        else { va = a[sortCol] || ''; vb = b[sortCol] || ''; }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      if (!filtered.length) { container.innerHTML = '<div class="empty">No sessions match filters.</div>'; return; }

      // Pagination
      var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      var startIdx = (currentPage - 1) * PAGE_SIZE;
      var pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

      function thClass(col) {
        var cls = 'sortable';
        if (sortCol === col) cls += ' sort-' + sortDir;
        return cls;
      }

      var html = '';
      if (filtered.length > PAGE_SIZE) {
        html += '<div class="pagination">';
        html += '<span class="pagination-info">Showing ' + (startIdx + 1) + '\\u2013' + Math.min(startIdx + PAGE_SIZE, filtered.length) + ' of ' + filtered.length + ' sessions</span>';
        html += '<div class="pagination-controls">';
        if (currentPage > 1) html += '<button class="btn pagination-btn" data-page="' + (currentPage - 1) + '">\\u25C0 Prev</button>';
        // Page numbers
        for (var p = 1; p <= totalPages; p++) {
          if (p === currentPage) html += '<button class="btn btn-primary pagination-btn" data-page="' + p + '">' + p + '</button>';
          else if (p <= 2 || p >= totalPages - 1 || Math.abs(p - currentPage) <= 1) html += '<button class="btn pagination-btn" data-page="' + p + '">' + p + '</button>';
          else if (p === 3 && currentPage > 4) { html += '<span class="pagination-ellipsis">\\u2026</span>'; p = Math.min(currentPage - 2, totalPages - 3); }
          else if (p > currentPage + 1 && p < totalPages - 1) { html += '<span class="pagination-ellipsis">\\u2026</span>'; p = totalPages - 2; }
        }
        if (currentPage < totalPages) html += '<button class="btn pagination-btn" data-page="' + (currentPage + 1) + '">Next \\u25B6</button>';
        html += '</div></div>';
      }

      html += '<div class="table-wrap"><table><thead><tr>';
      html += '<th>Session</th><th>Agent</th>';
      html += '<th class="' + thClass('started_at') + '" data-sort="started_at">Started</th>';
      html += '<th class="' + thClass('last_active') + '" data-sort="last_active">Last Active</th>';
      html += '<th class="' + thClass('duration') + '" data-sort="duration">Duration</th>';
      html += '<th class="' + thClass('events') + '" data-sort="events">Events</th>';
      html += '<th class="' + thClass('annotations') + '" data-sort="annotations">Annotations</th>';
      html += '</tr></thead><tbody>';

      pageItems.forEach(function(s) {
        var project = cleanProjectName(s);
        var displayTitle = s.title || s.id.substring(0, 8);
        html += '<tr onclick="location.href=\\'/session/' + s.id + '\\'\" style="cursor:pointer">';
        html += '<td><a class="session-id" href="/session/' + s.id + '">' + escapeHtml(truncate(displayTitle, 60)) + '</a>';
        html += '<br><small style="color:var(--text-muted)">' + escapeHtml(s.id.substring(0, 8));
        if (project) html += ' \\u00B7 ' + escapeHtml(truncate(project, 30));
        html += '</small>';
        html += '</td>';
        html += '<td>' + escapeHtml(s.agent || s.source || '\\u2014') + '</td>';
        html += '<td>' + formatDate(s.started_at) + '</td>';
        html += '<td>' + (s.ended_at ? formatDate(s.ended_at) : '<span style="color:var(--text-muted)">\\u2014</span>') + '</td>';
        html += '<td>' + formatDuration(s.started_at, s.ended_at) + '</td>';
        html += '<td>' + (s.event_count || 0) + '</td>';
        html += '<td>' + (s.annotation_count || 0) + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';

      // Bottom pagination for long lists
      if (filtered.length > PAGE_SIZE) {
        html += '<div class="pagination" style="margin-top:16px">';
        html += '<span class="pagination-info">Page ' + currentPage + ' of ' + totalPages + '</span>';
        html += '<div class="pagination-controls">';
        if (currentPage > 1) html += '<button class="btn pagination-btn" data-page="' + (currentPage - 1) + '">\\u25C0 Prev</button>';
        if (currentPage < totalPages) html += '<button class="btn pagination-btn" data-page="' + (currentPage + 1) + '">Next \\u25B6</button>';
        html += '</div></div>';
      }

      container.innerHTML = html;

      container.querySelectorAll('th.sortable').forEach(function(th) {
        th.addEventListener('click', function() {
          var col = th.getAttribute('data-sort');
          if (sortCol === col) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
          else { sortCol = col; sortDir = 'desc'; }
          currentPage = 1;
          renderTable();
        });
      });

      container.querySelectorAll('.pagination-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          currentPage = parseInt(btn.dataset.page, 10);
          renderTable();
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    async function load() {
      var since = document.getElementById('filter-since').value;
      var limit = document.getElementById('filter-limit').value;
      var url = '/api/sessions?limit=' + encodeURIComponent(limit);
      if (since) url += '&since=' + encodeURIComponent(since);
      container.innerHTML = '<div class="loading">Loading sessions...</div>';
      currentPage = 1;
      try {
        sessionsData = await apiFetch(url);
        // Populate project filter
        var projectSelect = document.getElementById('filter-project');
        var projects = {};
        sessionsData.forEach(function(s) {
          var name = cleanProjectName(s);
          if (name) projects[name] = (projects[name] || 0) + 1;
        });
        var currentVal = projectSelect.value;
        projectSelect.innerHTML = '<option value="">All projects (' + sessionsData.length + ')</option>';
        Object.keys(projects).sort().forEach(function(p) {
          projectSelect.innerHTML += '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + ' (' + projects[p] + ')</option>';
        });
        // Restore or apply URL param
        var urlProject = new URLSearchParams(location.search).get('project');
        if (urlProject) projectSelect.value = urlProject;
        else if (currentVal) projectSelect.value = currentVal;

        renderTable();
      } catch(e) { container.innerHTML = '<div class="empty">Error: ' + escapeHtml(e.message) + '</div>'; }
    }

    filterForm.addEventListener('submit', function(e) { e.preventDefault(); load(); });
    document.getElementById('filter-limit').addEventListener('change', load);
    document.getElementById('filter-project').addEventListener('change', function() { currentPage = 1; renderTable(); });
    document.getElementById('filter-trivial').addEventListener('change', function() { currentPage = 1; renderTable(); });
    load();
  }

  // ===== Ingest Bar =====

  function initIngestBar(onIngest) {
    var bar = document.getElementById('ingest-bar');
    if (!bar) return;

    async function refresh() {
      try {
        var st = await apiFetch('/api/ingest/status');
        var html = '<span class="ingest-status">';
        if (st.pending > 0) {
          html += '<span class="ingest-pending">' + st.pending + ' session(s) pending import</span>';
        } else {
          html += '<span class="ingest-ok">All ' + st.already_imported + ' sessions synced</span>';
        }
        html += '</span>';
        html += '<button class="btn btn-success" id="sync-now-btn">Sync Now</button>';
        html += '<span class="auto-ingest-toggle">';
        html += '<label><input type="checkbox" id="auto-ingest-check"' + (st.auto_ingest ? ' checked' : '') + '> Auto-sync every</label>';
        html += '<select id="auto-ingest-interval">';
        [1,2,5,10,30].forEach(function(m) {
          html += '<option value="' + m + '"' + (st.auto_ingest_interval_min === m ? ' selected' : '') + '>' + m + 'min</option>';
        });
        html += '</select>';
        html += '</span>';
        bar.innerHTML = html;

        document.getElementById('sync-now-btn').addEventListener('click', async function() {
          var btn = this;
          btn.textContent = 'Syncing...';
          btn.disabled = true;
          try {
            var r = await fetch('/api/ingest', { method: 'POST' }).then(function(r){return r.json()});
            var parts = [];
            if (r.imported > 0) parts.push(r.imported + ' imported');
            if (r.updated > 0) parts.push(r.updated + ' updated');
            if (parts.length === 0) parts.push('Already up to date');
            btn.textContent = parts.join(', ');
            btn.style.minWidth = btn.offsetWidth + 'px';
            setTimeout(function() { refresh(); if (onIngest) onIngest(); }, 1500);
          } catch(e) {
            btn.textContent = 'Error!';
            setTimeout(function() { refresh(); }, 2000);
          }
        });

        document.getElementById('auto-ingest-check').addEventListener('change', function() {
          var enabled = this.checked;
          var mins = parseInt(document.getElementById('auto-ingest-interval').value, 10);
          fetch('/api/ingest/auto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: enabled, interval_minutes: mins }),
          }).then(function() { refresh(); });
        });

        document.getElementById('auto-ingest-interval').addEventListener('change', function() {
          var enabled = document.getElementById('auto-ingest-check').checked;
          if (!enabled) return;
          var mins = parseInt(this.value, 10);
          fetch('/api/ingest/auto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true, interval_minutes: mins }),
          });
        });
      } catch(e) { bar.innerHTML = ''; }
    }
    refresh();
  }

  // ===== Enrichment Bar (Sessions Page) =====

  function initEnrichmentBar(onEnrich) {
    var bar = document.getElementById('enrichment-bar');
    if (!bar) return;

    var pollTimer = null;

    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    function getSelectedProvider(model) {
      return model && model.startsWith('claude-') ? 'anthropic' : 'openai';
    }

    function buildModelSelect(st) {
      var models = st.supported_models || { anthropic: [], openai: [] };
      var current = st.model || 'claude-haiku-4-5-20251001';
      var html = '<select id="model-select" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:var(--radius);font-size:12px">';
      html += '<optgroup label="Anthropic">';
      for (var i = 0; i < models.anthropic.length; i++) {
        html += '<option value="' + models.anthropic[i] + '"' + (models.anthropic[i] === current ? ' selected' : '') + '>' + models.anthropic[i] + '</option>';
      }
      html += '</optgroup><optgroup label="OpenAI">';
      for (var i = 0; i < models.openai.length; i++) {
        html += '<option value="' + models.openai[i] + '"' + (models.openai[i] === current ? ' selected' : '') + '>' + models.openai[i] + '</option>';
      }
      html += '</optgroup></select>';
      return html;
    }

    function buildApiKeyInput(st) {
      var model = st.model || 'claude-haiku-4-5-20251001';
      var provider = getSelectedProvider(model);
      var hasKey = provider === 'anthropic' ? st.has_anthropic_key : st.has_openai_key;
      if (hasKey) return '';
      var placeholder = provider === 'anthropic' ? 'sk-ant-...' : 'sk-...';
      var html = '<input type="password" id="api-key-input" placeholder="' + placeholder + '" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:var(--radius);font-size:12px;flex:1 1 150px;min-width:120px;max-width:260px">';
      html += '<button class="btn btn-primary" id="save-api-key-btn">Save Key</button>';
      return html;
    }

    function currentModelHasKey(st) {
      var model = st.model || 'claude-haiku-4-5-20251001';
      var provider = getSelectedProvider(model);
      return provider === 'anthropic' ? st.has_anthropic_key : st.has_openai_key;
    }

    async function refresh() {
      try {
        var st = await apiFetch('/api/enrichment/status');
        var html = '<span class="ingest-status">';

        if (st.running) {
          var prog = st.progress || { done: 0, total: 0, errors: 0 };
          html += '<span style="color:var(--warning)">AI enrichment running... ' + prog.done + '/' + prog.total;
          if (prog.errors > 0) html += ' (' + prog.errors + ' errors)';
          html += '</span>';
          html += '</span>';
          html += buildModelSelect(st);
          html += '<span style="color:var(--text-muted);font-size:12px">' + st.enriched + '/' + st.total + ' enriched</span>';
          bar.innerHTML = html;
          bindModelSelect(st);
          if (!pollTimer) pollTimer = setInterval(function() { refresh(); }, 3000);
          return;
        }
        stopPolling();

        if (st.last_error) {
          html += '<span style="color:var(--danger)">Error: ' + st.last_error + '</span>';
        } else if (!currentModelHasKey(st)) {
          var provider = getSelectedProvider(st.model || 'claude-haiku-4-5-20251001');
          html += '<span style="color:var(--warning)">No ' + provider + ' API key</span>';
        } else if (st.pending > 0) {
          html += '<span style="color:var(--accent)">' + st.pending + ' session(s) need AI enrichment</span>';
        } else {
          html += '<span style="color:var(--success)">All ' + st.enriched + ' sessions AI-enriched</span>';
        }
        html += '</span>';
        html += buildModelSelect(st);
        html += buildApiKeyInput(st);
        html += '<span style="color:var(--text-muted);font-size:12px">' + st.enriched + '/' + st.total + ' enriched</span>';

        if (currentModelHasKey(st)) {
          html += '<div class="enrichment-actions">';
          if (st.pending > 0) {
            html += '<button class="btn btn-primary" id="enrich-all-btn">Enrich All</button>';
            html += '<button class="btn" id="enrich-force-btn">Force All</button>';
          } else {
            html += '<button class="btn" id="enrich-force-btn">Re-enrich All</button>';
          }
          html += '</div>';
        }
        bar.innerHTML = html;

        bindModelSelect(st);

        // Bind API key save
        var saveBtn = document.getElementById('save-api-key-btn');
        if (saveBtn) {
          var provider = getSelectedProvider(st.model || 'claude-haiku-4-5-20251001');
          saveBtn.addEventListener('click', async function() {
            var input = document.getElementById('api-key-input');
            var key = input ? input.value.trim() : '';
            if (!key) return;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            try {
              var r = await fetch('/api/enrichment/api-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: key, provider: provider }),
              });
              var res = await r.json();
              if (res.error) { alert(res.error); saveBtn.textContent = 'Save Key'; saveBtn.disabled = false; return; }
              refresh();
            } catch(e) { alert('Error: ' + e.message); saveBtn.textContent = 'Save Key'; saveBtn.disabled = false; }
          });
        }

        var enrichBtn = document.getElementById('enrich-all-btn');
        if (enrichBtn) {
          enrichBtn.addEventListener('click', async function() {
            enrichBtn.textContent = 'Starting...';
            enrichBtn.disabled = true;
            var sel = document.getElementById('model-select');
            var model = sel ? sel.value : undefined;
            try {
              await fetch('/api/enrichment/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: model }),
              });
              refresh();
            } catch(e) { alert('Error: ' + e.message); }
          });
        }

        var forceBtn = document.getElementById('enrich-force-btn');
        if (forceBtn) {
          forceBtn.addEventListener('click', async function() {
            forceBtn.textContent = 'Starting...';
            forceBtn.disabled = true;
            var sel = document.getElementById('model-select');
            var model = sel ? sel.value : undefined;
            try {
              await fetch('/api/enrichment/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true, model: model }),
              });
              refresh();
            } catch(e) { alert('Error: ' + e.message); }
          });
        }
      } catch(e) { bar.innerHTML = ''; }
    }

    function bindModelSelect(st) {
      var sel = document.getElementById('model-select');
      if (sel) {
        sel.addEventListener('change', async function() {
          var model = sel.value;
          try {
            await fetch('/api/enrichment/model', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: model }),
            });
            refresh();
          } catch(e) { /* ignore */ }
        });
      }
    }

    refresh();
  }

  // ===== Page: Session Detail =====

  function initSessionDetailPage() {
    var el = document.getElementById('session-detail');
    if (!el) return;
    var sessionId = el.dataset.sessionId;
    if (!sessionId) return;

    async function load() {
      var results = await Promise.all([
        apiFetch('/api/sessions/' + sessionId),
        apiFetch('/api/sessions/' + sessionId + '/events?limit=2000'),
        apiFetch('/api/sessions/' + sessionId + '/annotations'),
        apiFetch('/api/sessions/' + sessionId + '/files'),
      ]);
      var session = results[0], events = results[1], annotations = results[2], files = results[3];

      // Update page title with session title
      if (session.title) {
        var pageH1 = document.querySelector('#session-detail .page-header h1');
        if (pageH1) pageH1.innerHTML = escapeHtml(session.title) + ' <span style="font-family:var(--font-mono);color:var(--text-muted);font-size:16px">' + escapeHtml(session.id.substring(0, 8)) + '</span>';
      }

      // Sidebar: session info
      var info = document.getElementById('session-info');
      if (info) {
        var html = '<dl>';
        html += '<dt>ID</dt><dd style="font-family:var(--font-mono)">' + escapeHtml(session.id) + '</dd>';
        html += '<dt>Source</dt><dd>' + escapeHtml(session.source) + '</dd>';
        if (session.agent) html += '<dt>Agent</dt><dd>' + escapeHtml(session.agent) + '</dd>';
        if (session.command) html += '<dt>Command</dt><dd style="font-family:var(--font-mono)">' + escapeHtml(session.command) + '</dd>';
        if (session.cwd) html += '<dt>Directory</dt><dd style="font-family:var(--font-mono);font-size:12px">' + escapeHtml(session.cwd) + '</dd>';
        if (session.git_branch) html += '<dt>Branch</dt><dd>' + escapeHtml(session.git_branch) + '</dd>';
        html += '<dt>Started</dt><dd>' + formatDate(session.started_at) + '</dd>';
        if (session.ended_at) {
          html += '<dt>Ended</dt><dd>' + formatDate(session.ended_at) + '</dd>';
          html += '<dt>Duration</dt><dd>' + formatDuration(session.started_at, session.ended_at) + '</dd>';
        }
        html += '</dl>';
        info.innerHTML = html;
      }

      // Sidebar: event counts
      var counts = document.getElementById('event-counts');
      if (counts && session.event_counts) {
        var html = '';
        Object.entries(session.event_counts).sort(function(a,b){return b[1]-a[1]}).forEach(function(e) {
          html += '<div class="bar-row"><span class="bar-label"><span class="badge badge-' + e[0] + '">' + escapeHtml(e[0]) + '</span></span>';
          html += '<span class="bar-count">' + e[1] + '</span></div>';
        });
        counts.innerHTML = html;
      }

      // Sidebar: files
      var filesList = document.getElementById('files-list');
      if (filesList) {
        if (files.length === 0) { filesList.innerHTML = '<div class="empty" style="padding:8px">No file changes recorded.</div>'; }
        else {
          var html = '<ul class="file-list">';
          files.forEach(function(f) {
            html += '<li><span class="change-' + f.change_type + '">' + escapeHtml(f.change_type) + '</span> ' + escapeHtml(f.file_path) + '</li>';
          });
          html += '</ul>';
          filesList.innerHTML = html;
        }
      }

      // Enrichment info
      var enrichInfo = document.getElementById('enrichment-info');
      if (enrichInfo) {
        var ehtml = '<dl>';
        if (session.enriched_at) {
          ehtml += '<dt>Last enriched</dt><dd>' + formatDate(session.enriched_at) + '</dd>';
          ehtml += '<dt>Status</dt><dd style="color:var(--success)">Enriched</dd>';
        } else {
          ehtml += '<dt>Status</dt><dd style="color:var(--text-muted)">Not enriched</dd>';
        }
        ehtml += '</dl>';
        enrichInfo.innerHTML = ehtml;
      }

      var enrichBtn = document.getElementById('enrich-session-btn');
      if (enrichBtn) {
        var newBtn = enrichBtn.cloneNode(true);
        enrichBtn.parentNode.replaceChild(newBtn, enrichBtn);
        newBtn.textContent = session.enriched_at ? 'Re-enrich with AI' : 'Enrich with AI';
        newBtn.disabled = false;
        newBtn.addEventListener('click', async function() {
          newBtn.textContent = 'Enriching...';
          newBtn.disabled = true;
          try {
            var r = await fetch('/api/enrichment/session/' + sessionId, { method: 'POST' }).then(function(r) { return r.json(); });
            if (r.success) {
              newBtn.textContent = 'Done!';
              setTimeout(function() { load(); }, 500);
            } else {
              newBtn.textContent = r.fallback ? 'Fallback: ' + (r.error || 'unknown error') : 'Failed';
              newBtn.style.fontSize = '11px';
              setTimeout(function() { load(); }, 3000);
            }
          } catch(e) {
            newBtn.textContent = 'Error';
            alert('Enrichment error: ' + e.message);
          }
        });
      }

      // Timeline: separate event-level vs session-level annotations
      var eventAnnotations = {};
      var sessionAnnotations = [];
      annotations.forEach(function(a) {
        if (a.event_id) {
          if (!eventAnnotations[a.event_id]) eventAnnotations[a.event_id] = [];
          eventAnnotations[a.event_id].push(a);
        } else {
          sessionAnnotations.push(a);
        }
      });

      var items = [];
      events.forEach(function(ev) { items.push({ kind: 'event', ts: ev.timestamp, data: ev }); });
      sessionAnnotations.forEach(function(a) { items.push({ kind: 'annotation', ts: a.timestamp, data: a }); });
      items.sort(function(a,b) { return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0; });

      var timeline = document.getElementById('timeline');
      if (!timeline) return;
      if (items.length === 0) { timeline.innerHTML = '<div class="empty">No events recorded.</div>'; return; }

      var html = '';
      items.forEach(function(item, i) {
        if (item.kind === 'annotation') {
          var a = item.data;
          html += '<div class="timeline-item annotation ' + escapeHtml(a.type) + '">';
          html += '<div class="timeline-header">';
          html += '<span class="time">' + formatDateShort(a.timestamp) + '</span>';
          html += '<span class="badge badge-' + escapeHtml(a.type) + '">' + escapeHtml(a.type) + '</span>';
          html += '<span class="summary">' + escapeHtml(a.content) + '</span>';
          html += '</div></div>';
        } else {
          var ev = item.data;
          // Detect plan mode events
          var isPlanMode = false;
          var planName = null;
          var planContent = null;
          var badgeType = ev.type;
          try {
            var evData = JSON.parse(ev.data_json);
            if (evData.tool_name === 'EnterPlanMode') {
              isPlanMode = true;
              badgeType = 'plan';
            }
            if (evData.tool_name === 'ExitPlanMode') {
              isPlanMode = true;
              badgeType = 'plan';
              if (evData.tool_input && evData.tool_input.plan) {
                planContent = evData.tool_input.plan;
              }
            }
            if (evData.tool_name === 'Write' && evData.tool_input && evData.tool_input.file_path) {
              var fp = evData.tool_input.file_path;
              var planMatch = fp.match(/\\.claude\\/plans\\/([^/]+)\\.md$/);
              if (planMatch) {
                planName = planMatch[1];
                isPlanMode = true;
                badgeType = 'plan';
                if (evData.tool_input.content) planContent = evData.tool_input.content;
              }
            }
          } catch(e) {}

          var itemClass = 'timeline-item';
          if (isPlanMode) itemClass += ' plan-mode';
          html += '<div class="' + itemClass + '" id="event-' + ev.id + '" data-idx="' + i + '" data-event-id="' + ev.id + '">';
          html += '<div class="timeline-header">';
          html += '<span class="time">' + formatDateShort(ev.timestamp) + '</span>';
          html += '<span class="badge badge-' + escapeHtml(badgeType) + '">' + escapeHtml(badgeType) + '</span>';
          var summary = escapeHtml(extractSummary(ev));
          if (planName) {
            summary += ' <a href="/plans/' + encodeURIComponent(planName) + '" class="plan-link" onclick="event.stopPropagation()">[View Plan]</a>';
          }
          html += '<span class="summary">' + summary + '</span>';
          html += '<button class="btn-annotate" data-event-id="' + ev.id + '">+ annotate</button>';
          html += '</div>';
          if (planContent) {
            html += '<div class="timeline-body"><div class="plan-content">' + renderMarkdown(planContent) + '</div></div>';
          } else {
            html += '<div class="timeline-body"><pre>' + escapeHtml(JSON.stringify(JSON.parse(ev.data_json), null, 2)) + '</pre></div>';
          }

          // Event-level annotations
          var evAnns = eventAnnotations[ev.id];
          if (evAnns && evAnns.length) {
            html += '<div class="event-annotations">';
            evAnns.forEach(function(ea) {
              html += '<div class="event-annotation ' + escapeHtml(ea.type) + '">';
              html += '<span class="badge badge-' + escapeHtml(ea.type) + '">' + escapeHtml(ea.type) + '</span> ';
              html += escapeHtml(ea.content);
              html += ' <span style="color:var(--text-muted);font-size:11px">' + formatDateShort(ea.timestamp) + '</span>';
              html += '</div>';
            });
            html += '</div>';
          }

          html += '<div class="inline-ann-container" data-event-id="' + ev.id + '"></div>';
          html += '</div>';
        }
      });
      timeline.innerHTML = html;

      // Scroll to hash target (e.g. #event-123)
      if (location.hash) {
        var hashTarget = document.getElementById(location.hash.substring(1));
        if (hashTarget) {
          setTimeout(function() {
            hashTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            hashTarget.classList.add('expanded');
            hashTarget.classList.add('highlight');
          }, 100);
        }
      }

      // Toggle expand (but not on annotate button or inline form)
      timeline.querySelectorAll('.timeline-item:not(.annotation)').forEach(function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.closest('.btn-annotate') || e.target.closest('.inline-ann-form') || e.target.closest('.inline-ann-container') || e.target.closest('.plan-link')) return;
          el.classList.toggle('expanded');
        });
      });

      // Annotate buttons
      timeline.querySelectorAll('.btn-annotate').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var eventId = btn.getAttribute('data-event-id');
          var ctr = timeline.querySelector('.inline-ann-container[data-event-id="' + eventId + '"]');
          if (!ctr) return;
          if (ctr.innerHTML) { ctr.innerHTML = ''; return; }
          ctr.innerHTML = '<form class="inline-ann-form">' +
            '<select class="inline-ann-type">' +
              '<option value="decision_note">decision_note</option>' +
              '<option value="risk_flag">risk_flag</option>' +
              '<option value="override_record">override_record</option>' +
              '<option value="constraint_note">constraint_note</option>' +
            '</select>' +
            '<input type="text" class="inline-ann-content" placeholder="Annotation...">' +
            '<button type="submit" class="btn btn-primary">Add</button>' +
          '</form>';
          ctr.querySelector('form').addEventListener('submit', async function(fe) {
            fe.preventDefault();
            fe.stopPropagation();
            var type = ctr.querySelector('.inline-ann-type').value;
            var content = ctr.querySelector('.inline-ann-content').value.trim();
            if (!content) return;
            try {
              await fetch('/api/annotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, event_id: parseInt(eventId, 10), type: type, content: content }),
              });
              load();
            } catch(err) { alert('Error: ' + err.message); }
          });
          ctr.querySelector('.inline-ann-content').focus();
        });
      });
    }

    // Session-level annotation form
    var form = document.getElementById('annotation-form');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var type = document.getElementById('ann-type').value;
        var content = document.getElementById('ann-content').value.trim();
        if (!content) return;
        try {
          await fetch('/api/annotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, type: type, content: content }),
          });
          document.getElementById('ann-content').value = '';
          load();
        } catch(err) { alert('Error creating annotation: ' + err.message); }
      });
    }

    load();
  }

  // ===== Page: Search =====

  function initSearchPage() {
    var input = document.getElementById('search-input');
    var typeFilter = document.getElementById('search-type');
    var results = document.getElementById('search-results');
    if (!input || !results) return;

    var debounceTimer;
    async function doSearch() {
      var q = input.value.trim();
      if (!q) { results.innerHTML = '<div class="empty">Enter a search term to find events.</div>'; return; }
      var type = typeFilter ? typeFilter.value : '';
      var url = '/api/events?search=' + encodeURIComponent(q) + '&limit=100';
      if (type) url += '&type=' + encodeURIComponent(type);
      results.innerHTML = '<div class="loading">Searching...</div>';
      try {
        var events = await apiFetch(url);
        if (!events.length) { results.innerHTML = '<div class="empty">No events found matching "' + escapeHtml(q) + '".</div>'; return; }
        var html = '';
        events.forEach(function(ev) {
          var evLink = '/session/' + ev.session_id + (ev.id ? '#event-' + ev.id : '');
          html += '<div class="search-result clickable" onclick="location.href=\\'' + evLink + '\\'">';
          html += '<div class="search-meta">';
          html += '<span class="badge badge-' + escapeHtml(ev.type) + '">' + escapeHtml(ev.type) + '</span> ';
          var evLabel = ev.session_title ? truncate(ev.session_title, 40) : ev.session_id.substring(0,8);
          html += '<a href="' + evLink + '" onclick="event.stopPropagation()">' + escapeHtml(evLabel) + '</a>';
          html += ' &middot; ' + formatDate(ev.timestamp);
          html += '</div>';
          html += '<div class="search-content">' + escapeHtml(extractSummary(ev)) + '</div>';
          html += '</div>';
        });
        results.innerHTML = html;
      } catch(e) { results.innerHTML = '<div class="empty">Error: ' + escapeHtml(e.message) + '</div>'; }
    }

    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSearch, 300);
    });
    if (typeFilter) typeFilter.addEventListener('change', doSearch);
  }

  // ===== Page: Stats =====

  function initStatsPage() {
    var container = document.getElementById('stats-container');
    if (!container) return;

    async function load() {
      container.innerHTML = '<div class="loading">Loading stats...</div>';
      try {
        var stats = await apiFetch('/api/stats');
        var html = '';

        html += '<div class="stat-grid">';
        html += '<div class="stat-card"><div class="stat-value">' + (stats.total_sessions || 0) + '</div><div class="stat-label">Sessions</div></div>';
        html += '<div class="stat-card"><div class="stat-value">' + (stats.total_events || 0) + '</div><div class="stat-label">Events</div></div>';
        html += '<div class="stat-card"><div class="stat-value">' + (stats.total_annotations || 0) + '</div><div class="stat-label">Annotations</div></div>';
        html += '<div class="stat-card"><div class="stat-value">' + (stats.total_file_changes || 0) + '</div><div class="stat-label">File Changes</div></div>';
        html += '</div>';

        if (stats.events_by_type && stats.events_by_type.length) {
          html += '<h2 class="section-header">Events by Type</h2>';
          var maxEv = Math.max.apply(null, stats.events_by_type.map(function(e){return e.count}));
          html += '<div class="bar-chart">';
          stats.events_by_type.forEach(function(e) {
            var pct = maxEv > 0 ? (e.count / maxEv * 100) : 0;
            html += '<div class="bar-row"><span class="bar-label"><span class="badge badge-' + e.type + '">' + escapeHtml(e.type) + '</span></span>';
            html += '<div class="bar-fill" style="width:' + pct + '%"></div>';
            html += '<span class="bar-count">' + e.count + '</span></div>';
          });
          html += '</div>';
        }

        if (stats.annotations_by_type && stats.annotations_by_type.length) {
          html += '<h2 class="section-header">Annotations by Type</h2>';
          var maxAn = Math.max.apply(null, stats.annotations_by_type.map(function(e){return e.count}));
          html += '<div class="bar-chart">';
          stats.annotations_by_type.forEach(function(e) {
            var pct = maxAn > 0 ? (e.count / maxAn * 100) : 0;
            html += '<div class="bar-row" style="cursor:pointer" onclick="location.href=\\'/annotations?type=' + encodeURIComponent(e.type) + '\\'">';
            html += '<span class="bar-label"><span class="badge badge-' + e.type + '">' + escapeHtml(e.type) + '</span></span>';
            html += '<div class="bar-fill" style="width:' + pct + '%"></div>';
            html += '<span class="bar-count">' + e.count + '</span></div>';
          });
          html += '</div>';
        }

        if (stats.daily_activity && stats.daily_activity.length) {
          html += '<h2 class="section-header">Daily Activity (Last 30 Days)</h2>';
          var maxDay = Math.max.apply(null, stats.daily_activity.map(function(d){return d.count}));
          html += '<div class="activity-chart">';
          stats.daily_activity.forEach(function(d) {
            var pct = maxDay > 0 ? (d.count / maxDay * 100) : 0;
            html += '<div class="activity-bar" style="height:' + Math.max(pct, 2) + '%" data-tooltip="' + escapeHtml(d.date) + ': ' + d.count + ' events"></div>';
          });
          html += '</div>';
          if (stats.daily_activity.length > 1) {
            html += '<div class="activity-labels"><span>' + escapeHtml(stats.daily_activity[0].date) + '</span><span>' + escapeHtml(stats.daily_activity[stats.daily_activity.length-1].date) + '</span></div>';
          }
        }

        container.innerHTML = html;
      } catch(e) { container.innerHTML = '<div class="empty">Error: ' + escapeHtml(e.message) + '</div>'; }
    }
    load();
  }

  // ===== Page: Projects =====

  function initProjectsPage() {
    var container = document.getElementById('projects-container');
    if (!container) return;

    async function load() {
      container.innerHTML = '<div class="loading">Loading projects...</div>';
      try {
        var projects = await apiFetch('/api/projects');
        if (!projects.length) { container.innerHTML = '<div class="empty">No projects found.</div>'; return; }

        var html = '<div class="table-wrap"><table><thead><tr>';
        html += '<th>Project</th><th>Sessions</th><th>Events</th><th>Annotations</th>';
        html += '<th>Date Range</th><th>Total Duration</th>';
        html += '</tr></thead><tbody>';

        projects.forEach(function(p) {
          html += '<tr onclick="location.href=\\'/?project=' + encodeURIComponent(p.name) + '\\'\" style="cursor:pointer">';
          html += '<td><strong>' + escapeHtml(p.name) + '</strong></td>';
          html += '<td>' + p.session_count + '</td>';
          html += '<td>' + p.total_events + '</td>';
          html += '<td>' + p.total_annotations + '</td>';
          html += '<td>' + formatDate(p.first_session) + ' \\u2014 ' + formatDate(p.last_session) + '</td>';
          html += '<td>' + formatDurationMs(p.total_duration_ms) + '</td>';
          html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
      } catch(e) {
        container.innerHTML = '<div class="empty">Error: ' + escapeHtml(e.message) + '</div>';
      }
    }
    load();
  }

  // ===== Page: Annotations =====

  function initAnnotationsPage() {
    var container = document.getElementById('annotations-list');
    var typeFilter = document.getElementById('ann-filter-type');
    if (!container) return;

    var urlParams = new URLSearchParams(location.search);
    var presetType = urlParams.get('type');
    if (presetType && typeFilter) typeFilter.value = presetType;

    async function load() {
      var type = typeFilter ? typeFilter.value : '';
      var url = '/api/annotations?limit=200';
      if (type) url += '&type=' + encodeURIComponent(type);
      container.innerHTML = '<div class="loading">Loading annotations...</div>';
      try {
        var anns = await apiFetch(url);
        if (!anns.length) { container.innerHTML = '<div class="empty">No annotations found.</div>'; return; }
        var html = '';
        anns.forEach(function(a) {
          var annLink = a.session_id ? '/session/' + a.session_id + (a.event_id ? '#event-' + a.event_id : '') : '';
          html += '<div class="search-result' + (annLink ? ' clickable' : '') + '"' + (annLink ? ' onclick="location.href=\\'' + annLink + '\\'"' : '') + '>';
          html += '<div class="search-meta">';
          html += '<span class="badge badge-' + escapeHtml(a.type) + '">' + escapeHtml(a.type) + '</span> ';
          if (a.session_id) {
            var annLabel = a.session_title ? truncate(a.session_title, 40) : a.session_id.substring(0,8);
            html += '<a href="' + annLink + '" onclick="event.stopPropagation()">' + escapeHtml(annLabel) + '</a>';
          }
          if (a.project_name) html += ' &middot; ' + escapeHtml(a.project_name);
          html += ' &middot; ' + formatDate(a.timestamp);
          if (a.event_id) html += ' &middot; <span style="color:var(--text-muted)">event #' + a.event_id + '</span>';
          html += '</div>';
          html += '<div class="search-content">' + escapeHtml(a.content) + '</div>';
          html += '</div>';
        });
        container.innerHTML = html;
      } catch(e) { container.innerHTML = '<div class="empty">Error: ' + escapeHtml(e.message) + '</div>'; }
    }

    if (typeFilter) typeFilter.addEventListener('change', load);
    load();
  }

  // ===== Page: Plans =====

  function initPlansPage() {
    var container = document.getElementById('plans-container');
    if (!container) return;

    var plansData = [];
    var sortCol = 'mtime';
    var sortDir = 'desc';

    function renderPlansTable() {
      var sorted = plansData.slice();
      sorted.sort(function(a, b) {
        var va, vb;
        if (sortCol === 'name') {
          va = (a.title || a.name).toLowerCase(); vb = (b.title || b.name).toLowerCase();
        } else if (sortCol === 'project') {
          va = (a.project_name || '').toLowerCase(); vb = (b.project_name || '').toLowerCase();
        } else if (sortCol === 'mtime') {
          va = a.mtime || ''; vb = b.mtime || '';
        } else if (sortCol === 'size') {
          va = a.size || 0; vb = b.size || 0;
        } else {
          va = a[sortCol] || ''; vb = b[sortCol] || '';
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      function thSort(label, col) {
        var arrow = sortCol === col ? (sortDir === 'desc' ? ' \\u25BC' : ' \\u25B2') : '';
        return '<th class="sortable" data-sort="' + col + '">' + label + arrow + '</th>';
      }

      var html = '<div class="table-wrap"><table><thead><tr>';
      html += thSort('Plan', 'name') + thSort('Project', 'project') + '<th>Session</th>' + thSort('Modified', 'mtime');
      html += '</tr></thead><tbody>';

      sorted.forEach(function(p) {
        var displayName = p.title || p.name;
        html += '<tr onclick="location.href=\\'/plans/' + encodeURIComponent(p.name) + '\\'\" style="cursor:pointer">';
        html += '<td><strong><a href="/plans/' + encodeURIComponent(p.name) + '">' + escapeHtml(displayName) + '</a></strong></td>';
        html += '<td>' + escapeHtml(p.project_name || '\\u2014') + '</td>';
        html += '<td>';
        if (p.session_id) html += '<a href="/session/' + p.session_id + '">' + escapeHtml(p.session_id.substring(0,8)) + '</a>';
        else html += '\\u2014';
        html += '</td>';
        html += '<td>' + formatDate(p.mtime) + '</td>';
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      container.innerHTML = html;

      container.querySelectorAll('th.sortable').forEach(function(th) {
        th.addEventListener('click', function() {
          var col = th.dataset.sort;
          if (sortCol === col) { sortDir = sortDir === 'desc' ? 'asc' : 'desc'; }
          else { sortCol = col; sortDir = col === 'mtime' ? 'desc' : 'asc'; }
          renderPlansTable();
        });
      });
    }

    async function load() {
      container.innerHTML = '<div class="loading">Loading plans...</div>';
      try {
        plansData = await apiFetch('/api/plans');
        if (!plansData.length) { container.innerHTML = '<div class="empty">No plans found. Plans are created by Claude Code\\'s /plan command and saved in ~/.claude/plans/.</div>'; return; }
        renderPlansTable();
      } catch(e) { container.innerHTML = '<div class="empty">Error: ' + escapeHtml(e.message) + '</div>'; }
    }
    load();
  }

  // ===== Page: Plan Detail =====

  function initPlanDetailPage() {
    var el = document.getElementById('plan-detail');
    if (!el) return;
    var planName = el.dataset.planName;
    if (!planName) return;

    async function load() {
      try {
        var plan = await apiFetch('/api/plans/' + encodeURIComponent(planName));
        // Update page title with actual plan title
        var pageH1 = document.querySelector('#plan-detail .page-header h1');
        if (pageH1 && plan.title) pageH1.textContent = plan.title;

        var contentEl = document.getElementById('plan-content');
        if (contentEl) {
          contentEl.innerHTML = '<div class="plan-content">' + renderMarkdown(plan.content) + '</div>';
        }

        var meta = document.getElementById('plan-meta');
        if (meta) {
          var parts = [];
          if (plan.project_name) parts.push(plan.project_name);
          parts.push(formatDate(plan.mtime));
          meta.textContent = parts.join(' \\u2014 ');
        }

        var info = document.getElementById('plan-info');
        if (info) {
          var html = '<dl>';
          html += '<dt>File</dt><dd style="font-family:var(--font-mono);font-size:12px">' + escapeHtml(planName + '.md') + '</dd>';
          html += '<dt>Modified</dt><dd>' + formatDate(plan.mtime) + '</dd>';
          if (plan.project_name) html += '<dt>Project</dt><dd>' + escapeHtml(plan.project_name) + '</dd>';
          if (plan.session_id) html += '<dt>Session</dt><dd><a href="/session/' + plan.session_id + '">' + escapeHtml(plan.session_id.substring(0,8)) + '</a></dd>';
          html += '</dl>';
          info.innerHTML = html;
        }
      } catch(e) {
        var c = document.getElementById('plan-content');
        if (c) c.innerHTML = '<div class="empty">Error loading plan: ' + escapeHtml(e.message) + '</div>';
      }
    }
    load();
  }

  // ===== Router =====

  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('sessions-table')) initSessionsPage();
    if (document.getElementById('session-detail')) initSessionDetailPage();
    if (document.getElementById('search-input')) initSearchPage();
    if (document.getElementById('stats-container')) initStatsPage();
    if (document.getElementById('projects-container')) initProjectsPage();
    if (document.getElementById('annotations-list')) initAnnotationsPage();
    if (document.getElementById('plans-container')) initPlansPage();
    if (document.getElementById('plan-detail')) initPlanDetailPage();
  });
})();
`;
