const http = require('http');

let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
    return;
  }

  const match = url.match(/^\/todos\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    const todo = todos.find(t => t.id === id);

    if (method === 'GET') {
      if (todo) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todo));
      } else {
        res.writeHead(404);
        res.end();
      }
      return;
    }

    if (method === 'DELETE') {
      if (todo) {
        todos = todos.filter(t => t.id !== id);
        res.writeHead(204);
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
      return;
    }
  }

  if (method === 'POST' && url === '/todos') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (typeof data.title !== 'string' || data.title.trim() === '') {
          res.writeHead(400);
          res.end();
          return;
        }
        const todo = { id: nextId++, title: data.title, done: false };
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
