// In-memory Todo REST API using the built-in http module only
// Listen on process.env.PORT || 3000

const http = require('http');

const todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const { method, url } = req;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Parse URL
  const urlObj = new URL(req.url, 'http://localhost');
  const pathname = urlObj.pathname;

  // GET /todos
  if (method === 'GET' && pathname === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
    return;
  }

  // GET /todos/:id
  if (method === 'GET' && pathname.startsWith('/todos/')) {
    const id = parseInt(pathname.slice('/todos/'.length), 10);
    const todo = todos.find(t => t.id === id);
    if (todo) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(todo));
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  // POST /todos
  if (method === 'POST' && pathname === '/todos') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed.title !== 'string' || parsed.title.trim() === '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Title must be a non-empty string' }));
          return;
        }
        const todo = { id: nextId++, title: parsed.title, done: false };
        todos.push(todo);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todo));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // DELETE /todos/:id
  if (method === 'DELETE' && pathname.startsWith('/todos/')) {
    const id = parseInt(pathname.slice('/todos/'.length), 10);
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

  // Handle OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Any other route
  res.writeHead(404);
  res.end();
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
});
