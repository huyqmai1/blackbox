// HTML page templates for the web dashboard
// Each function returns a complete HTML string

function layout(title: string, content: string, activeNav: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — BlackBox</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-brand">BlackBox <span>Dashboard</span></a>
    <a href="/"${activeNav === 'sessions' ? ' class="active"' : ''}>Sessions</a>
    <a href="/projects"${activeNav === 'projects' ? ' class="active"' : ''}>Projects</a>
    <a href="/plans"${activeNav === 'plans' ? ' class="active"' : ''}>Plans</a>
    <a href="/search"${activeNav === 'search' ? ' class="active"' : ''}>Search</a>
    <a href="/stats"${activeNav === 'stats' ? ' class="active"' : ''}>Stats</a>
  </nav>
  <div class="container">
    ${content}
  </div>
  <script src="/app.js"></script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function sessionsListPage(): string {
  const content = `
    <div class="page-header">
      <h1>Sessions</h1>
      <p>All recorded AI agent sessions</p>
    </div>
    <div id="ingest-bar" class="ingest-bar"></div>
    <form id="sessions-filter" class="filters">
      <input type="date" id="filter-since" placeholder="Since date">
      <select id="filter-project"><option value="">All projects</option></select>
      <select id="filter-limit">
        <option value="">All sessions</option>
        <option value="50">50 sessions</option>
        <option value="100">100 sessions</option>
        <option value="250">250 sessions</option>
      </select>
      <label class="filter-checkbox"><input type="checkbox" id="filter-trivial"> Hide trivial</label>
      <button type="submit" class="btn">Filter</button>
    </form>
    <div id="sessions-table"><div class="loading">Loading sessions...</div></div>
  `;
  return layout('Sessions', content, 'sessions');
}

export function sessionDetailPage(sessionId: string): string {
  const content = `
    <div id="session-detail" data-session-id="${escapeHtml(sessionId)}">
      <div class="page-header">
        <h1>Session <span style="font-family:var(--font-mono);color:var(--text-link)">${escapeHtml(sessionId.substring(0, 8))}</span></h1>
      </div>
      <div class="detail-layout">
        <div>
          <div id="timeline"><div class="loading">Loading timeline...</div></div>
        </div>
        <div>
          <div class="sidebar-card">
            <h3>Session Info</h3>
            <div id="session-info"><div class="loading">Loading...</div></div>
          </div>
          <div class="sidebar-card">
            <h3>Event Counts</h3>
            <div id="event-counts"><div class="loading">Loading...</div></div>
          </div>
          <div class="sidebar-card">
            <h3>File Changes</h3>
            <div id="files-list"><div class="loading">Loading...</div></div>
          </div>
          <div class="sidebar-card">
            <h3>Add Annotation</h3>
            <form id="annotation-form" class="annotation-form">
              <select id="ann-type">
                <option value="decision_note">Decision Note</option>
                <option value="risk_flag">Risk Flag</option>
                <option value="override_record">Override Record</option>
                <option value="constraint_note">Constraint Note</option>
              </select>
              <textarea id="ann-content" placeholder="Write your annotation..."></textarea>
              <button type="submit" class="btn btn-primary">Add Annotation</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  return layout('Session ' + sessionId.substring(0, 8), content, 'sessions');
}

export function searchPage(): string {
  const content = `
    <div class="page-header">
      <h1>Search Events</h1>
      <p>Search across all sessions by event content</p>
    </div>
    <input type="text" id="search-input" class="search-input" placeholder="Search events..." autofocus>
    <div class="filters" style="margin-bottom:16px">
      <select id="search-type">
        <option value="">All types</option>
        <option value="user_prompt">user_prompt</option>
        <option value="ai_response">ai_response</option>
        <option value="tool_use">tool_use</option>
        <option value="tool_result">tool_result</option>
        <option value="file_change">file_change</option>
        <option value="command">command</option>
        <option value="error">error</option>
      </select>
    </div>
    <div id="search-results"><div class="empty">Enter a search term to find events.</div></div>
  `;
  return layout('Search', content, 'search');
}

export function statsPage(): string {
  const content = `
    <div class="page-header">
      <h1>Stats</h1>
      <p>Aggregate statistics across all sessions</p>
    </div>
    <div id="stats-container"><div class="loading">Loading stats...</div></div>
  `;
  return layout('Stats', content, 'stats');
}

export function projectsPage(): string {
  const content = `
    <div class="page-header">
      <h1>Projects</h1>
      <p>Sessions grouped by project</p>
    </div>
    <div id="projects-container"><div class="loading">Loading projects...</div></div>
  `;
  return layout('Projects', content, 'projects');
}

export function annotationsPage(): string {
  const content = `
    <div class="page-header">
      <h1>Annotations</h1>
      <p>All annotations across sessions</p>
    </div>
    <div class="filters" style="margin-bottom:16px">
      <select id="ann-filter-type">
        <option value="">All types</option>
        <option value="risk_flag">risk_flag</option>
        <option value="decision_note">decision_note</option>
        <option value="override_record">override_record</option>
        <option value="constraint_note">constraint_note</option>
      </select>
    </div>
    <div id="annotations-list"><div class="loading">Loading annotations...</div></div>
  `;
  return layout('Annotations', content, 'annotations');
}

export function plansPage(): string {
  const content = `
    <div class="page-header">
      <h1>Plans</h1>
      <p>Implementation plans from Claude Code sessions</p>
    </div>
    <div id="plans-container"><div class="loading">Loading plans...</div></div>
  `;
  return layout('Plans', content, 'plans');
}

export function planDetailPage(name: string): string {
  const displayName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const content = `
    <div id="plan-detail" data-plan-name="${escapeHtml(name)}">
      <div class="page-header">
        <h1>${escapeHtml(displayName)}</h1>
        <p id="plan-meta"></p>
      </div>
      <div class="detail-layout">
        <div>
          <div id="plan-content"><div class="loading">Loading plan...</div></div>
        </div>
        <div>
          <div class="sidebar-card">
            <h3>Plan Info</h3>
            <div id="plan-info"><div class="loading">Loading...</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
  return layout('Plan: ' + displayName, content, 'plans');
}
