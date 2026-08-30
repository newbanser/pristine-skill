// Implement an in-memory Todo REST API with the built-in http module only.
// Listen on process.env.PORT || 3000.

const http = require('http');
const { URL } = require('url');

const todos = [];
let nextId = 1;

const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  if (data !== undefined) res.end(JSON.stringify(data));
  else res.end();
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });

http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const idMatch = pathname.match(/^\/todos\/(\d+)$/);
    const isTodos = pathname === '/todos';

    if (isTodos && req.method === 'GET') {
      send(res, 200, todos);
    } else if (isTodos && req.method === 'POST') {
      const body = await readBody(req);
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) return send(res, 400, { error: 'title is required' });
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      send(res, 201, todo);
    } else if (idMatch && req.method === 'GET') {
      const todo = todos.find(t => t.id === Number(idMatch[1]));
      if (!todo) return send(res, 404, { error: 'Not found' });
      send(res, 200, todo);
    } else if (idMatch && req.method === 'DELETE') {
      const idx = todos.findIndex(t => t.id === Number(idMatch[1]));
      if (idx === -1) return send(res, 404, { error: 'Not found' });
      todos.splice(idx, 1);
      send(res, 204);
    } else {
      send(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    send(res, 400, { error: err.message });
  }
}).listen(process.env.PORT || 3000);

// ponytail: inline parsing/validation, no framework. Add body-size/type checks only if real clients misbehave.
