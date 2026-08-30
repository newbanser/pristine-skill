const http = require('http');

let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Helper to send JSON response
  const sendJSON = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // GET /todos
  if (req.method === 'GET' && path === '/todos') {
    sendJSON(200, todos);
    return;
  }

  // POST /todos
  if (req.method === 'POST' && path === '/todos') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const title = parsed.title;
        if (typeof title !== 'string' || title.trim() === '') {
          sendJSON(400, { error: 'Title is required and must be a non-empty string' });
          return;
        }
        const newTodo = { id: nextId++, title: title.trim(), done: false };
        todos.push(newTodo);
        sendJSON(201, newTodo);
      } catch (err) {
        sendJSON(400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // GET /todos/:id and DELETE /todos/:id
  const match = path.match(/^\/todos\/(\d+)$/);
  if (match) {
    const id = parseInt(match[1], 10);
    const index = todos.findIndex(t => t.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        sendJSON(404, { error: 'Todo not found' });
      } else {
        sendJSON(200, todos[index]);
      }
      return;
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        sendJSON(404, { error: 'Todo not found' });
      } else {
        todos.splice(index, 1);
        res.writeHead(204);
        res.end();
      }
      return;
    }
  }

  // Fallback
  sendJSON(404, { error: 'Not found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
