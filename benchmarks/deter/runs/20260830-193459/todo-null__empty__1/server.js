// Implement an in-memory Todo REST API with the built-in http module only.
// Listen on process.env.PORT || 3000.

const http = require('http');

// In-memory todo store
let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  // Parse URL and method
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Set CORS headers for browser testing
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route handlers
  if (method === 'GET' && path === '/todos') {
    // Return all todos
    res.writeHead(200);
    res.end(JSON.stringify(todos));
    return;
  }

  if (method === 'POST' && path === '/todos') {
    let body = '';
    
    // Collect request body data
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        // Parse JSON body
        const data = JSON.parse(body || '{}');
        
        // Validate title
        if (typeof data.title !== 'string' || data.title.trim() === '') {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Title is required and must be non-empty' }));
          return;
        }

        // Create new todo
        const todo = {
          id: nextId++,
          title: data.title,
          done: false
        };
        
        todos.push(todo);
        res.writeHead(201);
        res.end(JSON.stringify(todo));
      } catch (err) {
        // Invalid JSON
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });

    // Handle request errors
    req.on('error', (err) => {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Failed to read request body' }));
    });

    return;
  }

  // Handle delete requests for /todos/:id
  const todoMatch = path.match(/^\/todos\/(\d+)$/);
  if (method === 'DELETE' && todoMatch) {
    const id = parseInt(todoMatch[1]);
    const index = todos.findIndex(todo => todo.id === id);

    if (index === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Todo not found' }));
    } else {
      todos.splice(index, 1);
      res.writeHead(204);
      res.end();
    }
    return;
  }

  // Handle GET requests for /todos/:id
  if (method === 'GET' && todoMatch) {
    const id = parseInt(todoMatch[1]);
    const todo = todos.find(todo => todo.id === id);

    if (todo) {
      res.writeHead(200);
      res.end(JSON.stringify(todo));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Todo not found' }));
    }
    return;
  }

  // Handle unknown routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Todo API server running on port ${PORT}`);
});

// Export for testing if needed
module.exports = server;
