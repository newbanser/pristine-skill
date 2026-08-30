const http = require('http');
const { randomUUID } = require('crypto');

const todos = [];

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
    return;
  }

  const match = url.match(/^\/todos\/([^/]+)$/);
  if (method === 'GET' && match) {
    const todo = todos.find(t => t.id === decodeURIComponent(match[1]));
    if (todo) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(todo));
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  if (method === 'DELETE' && match) {
    const id = decodeURIComponent(match[1]);
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos.splice(index, 1);
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  if (method === 'POST' && url === '/todos') {
    let body = '';
    req.on('data', chunk => {
      if (body.length > 1e6) {
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data || typeof data.title !== 'string' || data.title.trim() === '') {
          res.writeHead(400);
          res.end();
          return;
        }
        const todo = { id: randomUUID(), title: data.title, done: false };
        todos.push(todo);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todo));
      } catch {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(process.env.PORT || 3000);
