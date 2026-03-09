// HTTP server for the web dashboard
// Uses node:http with a simple URL pattern router

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { exec } from 'node:child_process';
import { CSS, JS } from './assets.js';
import {
  sessionsListPage, sessionDetailPage, searchPage, statsPage,
  projectsPage, annotationsPage, plansPage, planDetailPage,
} from './pages.js';
import {
  handleApiSessions,
  handleApiSession,
  handleApiSessionEvents,
  handleApiSessionAnnotations,
  handleApiSessionFiles,
  handleApiEvents,
  handleApiCreateAnnotation,
  handleApiStats,
  handleApiProjects,
  handleApiAnnotations,
  handleIngestStatus,
  handleIngest,
  handleAutoIngest,
  handleApiPlans,
  handleApiPlan,
  handleEnrichmentStatus,
  handleEnrichAll,
  handleEnrichSession,
} from './api.js';

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendHtml(res: ServerResponse, html: string, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendText(res: ServerResponse, text: string, contentType: string, status = 200): void {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(text);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function matchRoute(pathname: string, pattern: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method ?? 'GET';

  try {
    // Static assets
    if (method === 'GET' && pathname === '/styles.css') {
      sendText(res, CSS, 'text/css; charset=utf-8');
      return;
    }
    if (method === 'GET' && pathname === '/app.js') {
      sendText(res, JS, 'application/javascript; charset=utf-8');
      return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      if (method === 'GET' && pathname === '/api/sessions') {
        sendJson(res, handleApiSessions(url.searchParams));
        return;
      }
      if (method === 'GET' && pathname === '/api/events') {
        sendJson(res, handleApiEvents(url.searchParams));
        return;
      }
      if (method === 'GET' && pathname === '/api/stats') {
        sendJson(res, handleApiStats());
        return;
      }
      if (method === 'GET' && pathname === '/api/projects') {
        sendJson(res, handleApiProjects());
        return;
      }
      if (method === 'GET' && pathname === '/api/annotations') {
        sendJson(res, handleApiAnnotations(url.searchParams));
        return;
      }
      if (method === 'POST' && pathname === '/api/annotations') {
        const body = JSON.parse(await readBody(req));
        sendJson(res, handleApiCreateAnnotation(body), 201);
        return;
      }
      if (method === 'GET' && pathname === '/api/plans') {
        sendJson(res, handleApiPlans());
        return;
      }

      // Ingest routes
      if (method === 'GET' && pathname === '/api/ingest/status') {
        sendJson(res, handleIngestStatus());
        return;
      }
      if (method === 'POST' && pathname === '/api/ingest') {
        sendJson(res, handleIngest());
        return;
      }
      if (method === 'POST' && pathname === '/api/ingest/auto') {
        const body = JSON.parse(await readBody(req));
        sendJson(res, handleAutoIngest(body));
        return;
      }

      // Enrichment routes
      if (method === 'GET' && pathname === '/api/enrichment/status') {
        sendJson(res, handleEnrichmentStatus());
        return;
      }
      if (method === 'POST' && pathname === '/api/enrichment/run') {
        const body = JSON.parse(await readBody(req));
        sendJson(res, await handleEnrichAll(body));
        return;
      }
      {
        const enrichParams = matchRoute(pathname, '/api/enrichment/session/:id');
        if (method === 'POST' && enrichParams) {
          sendJson(res, handleEnrichSession(enrichParams.id));
          return;
        }
      }

      // Parameterized API routes
      let params = matchRoute(pathname, '/api/sessions/:id');
      if (method === 'GET' && params) {
        const data = handleApiSession(params.id);
        if (!data) { sendJson(res, { error: 'Session not found' }, 404); return; }
        sendJson(res, data);
        return;
      }

      params = matchRoute(pathname, '/api/sessions/:id/events');
      if (method === 'GET' && params) {
        sendJson(res, handleApiSessionEvents(params.id, url.searchParams));
        return;
      }

      params = matchRoute(pathname, '/api/sessions/:id/annotations');
      if (method === 'GET' && params) {
        sendJson(res, handleApiSessionAnnotations(params.id));
        return;
      }

      params = matchRoute(pathname, '/api/sessions/:id/files');
      if (method === 'GET' && params) {
        sendJson(res, handleApiSessionFiles(params.id));
        return;
      }

      params = matchRoute(pathname, '/api/plans/:name');
      if (method === 'GET' && params) {
        const data = handleApiPlan(params.name);
        if (!data) { sendJson(res, { error: 'Plan not found' }, 404); return; }
        sendJson(res, data);
        return;
      }

      sendJson(res, { error: 'Not found' }, 404);
      return;
    }

    // Page routes
    if (method === 'GET') {
      if (pathname === '/') {
        sendHtml(res, sessionsListPage());
        return;
      }
      if (pathname === '/search') {
        sendHtml(res, searchPage());
        return;
      }
      if (pathname === '/stats') {
        sendHtml(res, statsPage());
        return;
      }
      if (pathname === '/projects') {
        sendHtml(res, projectsPage());
        return;
      }
      if (pathname === '/annotations') {
        sendHtml(res, annotationsPage());
        return;
      }
      if (pathname === '/plans') {
        sendHtml(res, plansPage());
        return;
      }

      let params = matchRoute(pathname, '/session/:id');
      if (params) {
        sendHtml(res, sessionDetailPage(params.id));
        return;
      }

      params = matchRoute(pathname, '/plans/:name');
      if (params) {
        sendHtml(res, planDetailPage(params.name));
        return;
      }
    }

    // 404
    sendHtml(res, '<h1>404 Not Found</h1>', 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (pathname.startsWith('/api/')) {
      sendJson(res, { error: message }, 400);
    } else {
      sendHtml(res, `<h1>Error</h1><p>${message}</p>`, 500);
    }
  }
}

export function startServer(port: number, open: boolean): void {
  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('Request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });
  });

  server.listen(port, '0.0.0.0', () => {
    const url = `http://0.0.0.0:${port}`;
    console.log(`BlackBox Dashboard running at ${url}`);

    if (open) {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${cmd} ${url}`);
    }
  });
}
