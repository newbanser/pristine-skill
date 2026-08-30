const http = require('http');

const todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const isTodosPath = pathParts.length >= 1 && pathParts[0] === 'todos';
  const id = pathParts.length >= 2 ? parseInt(pathParts[1], 10) : null;

  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && pathParts.length === 1 && isTodosPath) {
    res.writeHead(200);
    res.end(JSON.stringify(todos));
    return;
  }

  if (req.method === 'GET' && pathParts.length === 2 && isTodosPath) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      res.writeHead(200);
      res.end(JSON.stringify(todo));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }

  if (req.method === 'POST' && pathParts.length === 1 && isTodosPath) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      if (!parsed || typeof parsed.title !== 'string' || parsed.title.trim() === '') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Title is required and must be non-empty' }));
        return;
      }
      const todo = { id: nextId++, title: parsed.title.trim(), done: false };
      todos.push(todo);
      res.writeHead(201);
      res.end(JSON.stringify(todo));
    });
    return;
  }

  if (req.method === 'DELETE' && pathParts.length === 2 && isTodosPath) {
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos.splice(index, 1);
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(process.env.PORT || 3000);
