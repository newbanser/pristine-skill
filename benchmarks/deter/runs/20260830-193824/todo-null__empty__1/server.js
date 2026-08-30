const http = require('http');
const { URL } = require('url');

let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  res.setHeader('Content-Type', 'application/json');

  // GET /todos
  if (method === 'GET' && pathname === '/todos') {
    res.writeHead(200);
    res.end(JSON.stringify(todos));
    return;
  }

  // POST /todos
  if (method === 'POST' && pathname === '/todos') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // basic protection
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (typeof parsed.title !== 'string' || parsed.title.trim() === '') {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Title is required' }));
          return;
        }
        const todo = {
          id: nextId++,
          title: parsed.title,
          done: false
        };
        todos.push(todo);
        res.writeHead(201);
        res.end(JSON.stringify(todo));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /todos/:id
  const getMatch = pathname.match(/^\/todos\/(\d+)$/);
  if (method === 'GET' && getMatch) {
    const id = Number(getMatch[1]);
    const todo = todos.find(t => t.id === id);
    if (!todo) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(todo));
    return;
  }

  // DELETE /todos/:id
  const deleteMatch = pathname.match(/^\/todos\/(\d+)$/);
  if (method === 'DELETE' && deleteMatch) {
    const id = Number(deleteMatch[1]);
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    todos.splice(index, 1);
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(process.env.PORT || 3000);
