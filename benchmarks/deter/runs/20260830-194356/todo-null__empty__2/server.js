const http = require('http');
const { URL } = require('url');

let todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Helper: send JSON response
  const sendJSON = (statusCode, data) => {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(body);
  };

  // GET /todos
  if (req.method === 'GET' && pathname === '/todos') {
    return sendJSON(200, todos);
  }

  // POST /todos
  if (req.method === 'POST' && pathname === '/todos') {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk;
      // Protect against very large bodies
      if (rawBody.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(rawBody || '{}');
        const title = parsed.title;

        if (typeof title !== 'string' || title.trim() === '') {
          return sendJSON(400, { error: 'Title must be a non-empty string' });
        }

        const newTodo = {
          id: nextId++,
          title: title.trim(),
          done: false
        };
        todos.push(newTodo);
        return sendJSON(201, newTodo);
      } catch (err) {
        return sendJSON(400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // Routes with :id
  const todoMatch = pathname.match(/^\/todos\/(\d+)$/);

  if (todoMatch && req.method === 'GET') {
    const id = Number(todoMatch[1]);
    const todo = todos.find(t => t.id === id);
    if (!todo) return sendJSON(404, { error: 'Todo not found' });
    return sendJSON(200, todo);
  }

  if (todoMatch && req.method === 'DELETE') {
    const id = Number(todoMatch[1]);
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) return sendJSON(404, { error: 'Todo not found' });
    todos.splice(index, 1);
    res.writeHead(204);
    return res.end();
  }

  // 404 for any other route/method
  return sendJSON(404, { error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
