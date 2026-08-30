const http = require('http');

let todos = [];
let nextId = 1;

const sendJSON = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const parseBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try { resolve(JSON.parse(body)); } catch { resolve(null); }
  });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[1] ? Number(parts[1]) : null;

  if (req.method === 'GET' && parts[0] === 'todos' && parts.length === 1) {
    return sendJSON(res, 200, todos);
  }

  if (req.method === 'GET' && parts[0] === 'todos' && parts.length === 2) {
    const todo = todos.find(t => t.id === id);
    return todo ? sendJSON(res, 200, todo) : sendJSON(res, 404, { error: 'Not found' });
  }

  if (req.method === 'POST' && parts[0] === 'todos' && parts.length === 1) {
    const body = await parseBody(req);
    const title = body && typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return sendJSON(res, 400, { error: 'Title is required' });
    const todo = { id: nextId++, title, done: false };
    todos.push(todo);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(todo));
  }

  if (req.method === 'DELETE' && parts[0] === 'todos' && parts.length === 2) {
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: 'Not found' });
    todos.splice(idx, 1);
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(process.env.PORT || 3000);
