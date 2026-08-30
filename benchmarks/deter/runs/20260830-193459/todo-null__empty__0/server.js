// server.js
// Implement an in-memory Todo REST API with the built-in http module only.
// Listen on process.env.PORT || 3000.

const http = require('http');
const { URL } = require('url');

// In-memory todo storage
let todos = [];
let nextId = 1;

// Helper function to parse request body as JSON
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      // Limit body size to prevent abuse (e.g., 1MB max)
      if (body.length > 1e6) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve(null);
          return;
        }
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// Helper function to send empty response
function sendEmpty(res, statusCode) {
  res.writeHead(statusCode);
  res.end();
}

// Helper function to handle errors
function handleError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message });
}

// Route handler for GET /todos
function handleGetTodos(res) {
  sendJSON(res, 200, todos);
}

// Route handler for POST /todos
async function handlePostTodo(req, res) {
  try {
    const body = await parseBody(req);
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      handleError(res, 400, 'Request body must be a JSON object');
      return;
    }
    
    const { title } = body;
    
    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      handleError(res, 400, 'Title is required and must be a non-empty string');
      return;
    }
    
    // Create new todo
    const todo = {
      id: nextId++,
      title: title.trim(),
      done: false
    };
    
    todos.push(todo);
    sendJSON(res, 201, todo);
  } catch (err) {
    if (err.message === 'Invalid JSON') {
      handleError(res, 400, 'Invalid JSON in request body');
    } else if (err.message === 'Body too large') {
      handleError(res, 413, 'Request body too large');
    } else {
      handleError(res, 500, 'Internal server error');
    }
  }
}

// Route handler for GET /todos/:id
function handleGetTodoById(res, id) {
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    handleError(res, 404, 'Todo not found');
    return;
  }
  
  sendJSON(res, 200, todo);
}

// Route handler for DELETE /todos/:id
function handleDeleteTodo(res, id) {
  const index = todos.findIndex(t => t.id === id);
  
  if (index === -1) {
    handleError(res, 404, 'Todo not found');
    return;
  }
  
  todos.splice(index, 1);
  sendEmpty(res, 204);
}

// Main request handler
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;
    
    // CORS preflight handling (if needed)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }
    
    // Parse ID from path if present
    const idMatch = pathname.match(/^\/todos\/(\d+)$/);
    
    // Route handling
    if (pathname === '/todos' && method === 'GET') {
      handleGetTodos(res);
    } else if (pathname === '/todos' && method === 'POST') {
      await handlePostTodo(req, res);
    } else if (idMatch && method === 'GET') {
      const id = parseInt(idMatch[1]);
      handleGetTodoById(res, id);
    } else if (idMatch && method === 'DELETE') {
      const id = parseInt(idMatch[1]);
      handleDeleteTodo(res, id);
    } else {
      handleError(res, 404, 'Route not found');
    }
  } catch (err) {
    console.error('Server error:', err);
    handleError(res, 500, 'Internal server error');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Todo API server running on port ${PORT}`);
});
