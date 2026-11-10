'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { TodoStore } = require('./todoStore');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: 'Forbidden' });
  fs.readFile(filePath, (err, content) => {
    if (err) return sendJson(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
}

function createApp(store = new TodoStore()) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const match = url.pathname.match(/^\/api\/todos(?:\/(\d+))?$/);

    if (!match) {
      if (req.method === 'GET') return serveStatic(req, res);
      return sendJson(res, 404, { error: 'Not found' });
    }

    const id = match[1];
    try {
      if (!id && req.method === 'GET') {
        return sendJson(res, 200, store.list(url.searchParams.get('filter') || 'all'));
      }
      if (!id && req.method === 'POST') {
        const body = await readBody(req);
        return sendJson(res, 201, store.create(body.title));
      }
      if (!id && req.method === 'DELETE') {
        return sendJson(res, 200, { removed: store.clearCompleted() });
      }
      if (id && req.method === 'GET') {
        const todo = store.get(id);
        return todo ? sendJson(res, 200, todo) : sendJson(res, 404, { error: 'Todo not found' });
      }
      if (id && req.method === 'PATCH') {
        const body = await readBody(req);
        const todo = store.update(id, body);
        return todo ? sendJson(res, 200, todo) : sendJson(res, 404, { error: 'Todo not found' });
      }
      if (id && req.method === 'DELETE') {
        return store.remove(id) ? sendJson(res, 204) : sendJson(res, 404, { error: 'Todo not found' });
      }
      return sendJson(res, 405, { error: 'Method not allowed' });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`Todo app running at http://localhost:${port}`);
  });
}

module.exports = { createApp };
