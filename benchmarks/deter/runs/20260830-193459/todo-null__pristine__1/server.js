const http = require('http');

const todos = [];

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode);
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const isTodos = parts[0] === 'todos';
  const id = parts[1];

  if (!isTodos) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (req.method === 'GET' && parts.length === 1) {
    sendJson(res, 200, todos);
    return;
  }

  if (req.method === 'POST' && parts.length === 1) {
    try {
      const raw = await readBody(req);
      let title;
      try {
        title = JSON.parse(raw).title;
      } catch {
        sendJson(res, 400, { error: 'Invalid JSON' });
        return;
      }
      if (typeof title !== 'string' || title.trim() === '') {
        sendJson(res, 400, { error: 'Title is required' });
        return;
      }
      const todo = { id: String(todos.length + 1), title, done: false };
      todos.push(todo);
      sendJson(res, 201, todo);
    } catch {
      sendJson(res, 400, { error: 'Invalid request' });
    }
    return;
  }

  if (parts.length === 2) {
    const todo = todos.find(t => t.id === id);
    if (!todo) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    if (req.method === 'GET') {
      sendJson(res, 200, todo);
      return;
    }

    if (req.method === 'DELETE') {
      const index = todos.indexOf(todo);
      todos.splice(index, 1);
      sendEmpty(res, 204);
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(process.env.PORT || 3000);
