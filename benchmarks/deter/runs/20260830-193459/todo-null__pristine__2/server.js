// REST API for todos using Node.js built-in http module only
const http = require('http');

// In-memory storage with auto-incrementing IDs
let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  // Set CORS headers to allow cross-origin requests during development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Route: /todos
  if (pathParts.length === 1 && pathParts[0] === 'todos') {
    // GET /todos
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(todos));
      return;
    }

    // POST /todos
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const title = data.title;
          
          // Validate title
          if (typeof title !== 'string' || title.trim() === '') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Title is required and must be a non-empty string' }));
            return;
          }

          const todo = {
            id: nextId++,
            title: title.trim(),
            done: false
          };
          todos.push(todo);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(todo));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }
      });
      return;
    }
  }

  // Route: /todos/:id
  if (pathParts.length === 2 && pathParts[0] === 'todos') {
    const id = parseInt(pathParts[1]);
    
    // GET /todos/:id
    if (req.method === 'GET') {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todo));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Todo not found' }));
      }
      return;
    }

    // DELETE /todos/:id
    if (req.method === 'DELETE') {
      const index = todos.findIndex(t => t.id === id);
      if (index !== -1) {
        todos.splice(index, 1);
        res.writeHead(204);
        res.end();
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Todo not found' }));
      }
      return;
    }
  }

  // Method not allowed
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Todo API server running on port ${PORT}`);
});
