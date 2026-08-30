const http = require('http');

let todos = [];
let nextId = 1;

const sendJSON = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const parseBody = (req, callback) => {
  let rawBody = '';
  req.on('data', chunk => {
    if (rawBody.length > 1e6) {
      req.destroy();
      return;
    }
    rawBody += chunk;
  });
  req.on('end', () => {
    try {
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      callback(null, parsed);
    } catch (err) {
      callback(err);
    }
  });
  req.on('error', err => callback(err));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = parseInt(url.pathname.split('/')[2]);

  if (url.pathname === '/todos' && req.method === 'GET') {
    sendJSON(res, 200, todos);
    return;
  }

  if (url.pathname === '/todos' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err || typeof body.title !== 'string' || body.title.trim() === '') {
        sendJSON(res, 400, { error: 'Title is required' });
        return;
      }
      const todo = { id: nextId++, title: body.title.trim(), done: false };
      todos.push(todo);
      sendJSON(res, 201, todo);
    });
    return;
  }

  if (url.pathname.startsWith('/todos/') && req.method === 'GET') {
    const todo = todos.find(t => t.id === id);
    if (!todo) {
      sendJSON(res, 404, { error: 'Todo not found' });
      return;
    }
    sendJSON(res, 200, todo);
    return;
  }

  if (url.pathname.startsWith('/todos/') && req.method === 'DELETE') {
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
      sendJSON(res, 404, { error: 'Todo not found' });
      return;
    }
    todos.splice(index, 1);
    res.writeHead(204);
    res.end();
    return;
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(process.env.PORT || 3000);
