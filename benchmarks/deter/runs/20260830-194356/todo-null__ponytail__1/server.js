const http = require('http');
const crypto = require('crypto');

let todos = [];

const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data ? JSON.stringify(data) : '');
};

const readBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });
  req.on('end', () => resolve(body));
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.pathname.split('/')[2];

  try {
    if (req.method === 'GET' && url.pathname === '/todos') {
      send(res, 200, todos);
    } else if (req.method === 'POST' && url.pathname === '/todos') {
      const body = JSON.parse(await readBody(req) || '{}');
      if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
        return send(res, 400, { error: 'title required' });
      }
      const todo = { id: crypto.randomUUID(), title: body.title, done: false };
      todos.push(todo);
      send(res, 201, todo);
    } else if (req.method === 'GET' && url.pathname.startsWith('/todos/')) {
      const todo = todos.find(t => t.id === id);
      todo ? send(res, 200, todo) : send(res, 404, { error: 'not found' });
    } else if (req.method === 'DELETE' && url.pathname.startsWith('/todos/')) {
      const i = todos.findIndex(t => t.id === id);
      if (i === -1) return send(res, 404, { error: 'not found' });
      todos.splice(i, 1);
      send(res, 204);
    } else {
      send(res, 404, { error: 'not found' });
    }
  } catch {
    send(res, 400, { error: 'invalid json' });
  }
});

server.listen(process.env.PORT || 3000);
