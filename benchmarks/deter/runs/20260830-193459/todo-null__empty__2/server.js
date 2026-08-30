const http = require('http');
const { URL } = require('url');

// In-memory storage
let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  // Set CORS headers for better usability
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(part => part !== '');
  
  // Route: GET /todos
  if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
    return;
  }

  // Route: POST /todos
  if (req.method === 'POST' && pathParts.length === 1 && pathParts[0] === 'todos') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk;
      // Limit body size to prevent abuse (10KB max)
      if (body.length > 10240) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large' }));
        req.destroy();
        return;
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        
        // Validate title
        if (!parsed || typeof parsed.title !== 'string' || parsed.title.trim() === '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Title is required and must be a non-empty string' }));
          return;
        }

        const todo = {
          id: nextId++,
          title: parsed.title.trim(),
          done: false
        };
        
        todos.push(todo);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todo));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // Route: GET /todos/:id
  if (req.method === 'GET' && pathParts.length === 2 && pathParts[0] === 'todos') {
    const id = parseInt(pathParts[1], 10);
    
    if (isNaN(id)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid todo ID' }));
      return;
    }

    const todo = todos.find(item => item.id === id);
    
    if (!todo) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Todo not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todo));
    return;
  }

  // Route: DELETE /todos/:id
  if (req.method === 'DELETE' && pathParts.length === 2 && pathParts[0] === 'todos') {
    const id = parseInt(pathParts[1], 10);
    
    if (isNaN(id)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid todo ID' }));
      return;
    }

    const index = todos.findIndex(item => item.id === id);
    
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

  // 404 for any other route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Todo API server running on port ${PORT}`);
});
