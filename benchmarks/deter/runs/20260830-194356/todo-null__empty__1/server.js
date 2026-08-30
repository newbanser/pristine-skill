const http = require('http');

let todos = [];
let idCounter = 1;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS headers (optional, for browser testing)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /todos
  if (method === 'GET' && path === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
    return;
  }

  // POST /todos
  if (method === 'POST' && path === '/todos') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // limit body size to prevent abuse
      if (body.length > 1e6) req.destroy();
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const title = parsed.title;

        if (typeof title !== 'string' || title.trim() === '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Title is required' }));
          return;
        }

        const newTodo = {
          id: idCounter++,
          title: title.trim(),
          done: false
        };
        todos.push(newTodo);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTodo));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /todos/:id
  const matchGet = path.match(/^\/todos\/(\d+)$/);
  if (method === 'GET' && matchGet) {
    const id = parseInt(matchGet[1], 10);
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Todo not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todo));
    return;
  }

  // DELETE /todos/:id
  const matchDelete = path.match(/^\/todos\/(\d+)$/);
  if (method === 'DELETE' && matchDelete) {
    const id = parseInt(matchDelete[1], 10);
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Todo not found' }));
      return;
    }

    todos.splice(index, 1);
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
});
