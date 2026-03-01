const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const documents = new Map();
const connections = new Map();
const rateLimits = new Map(); // Rate limiting for WebSocket messages

// Simple rate limiter for WebSocket
const checkRateLimit = (socketId, limit = 50, windowMs = 1000) => {
  const now = Date.now();
  const key = socketId;
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const entry = rateLimits.get(key);
  
  if (entry.resetTime < now) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
};

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-document', (documentId, userData) => {
      socket.join(documentId);
      
      if (!connections.has(documentId)) {
        connections.set(documentId, new Map());
      }
      
      // Store full user data
      const userInfo = {
        fullName: userData.fullName || `User ${socket.id.slice(0, 4)}`,
        email: userData.email || '',
        userId: userData.userId || socket.id,
        firstName: userData.firstName || 'User'
      };
      
      connections.get(documentId).set(socket.id, userInfo);

      const users = Array.from(connections.get(documentId).entries()).map(([id, info]) => ({
        id,
        fullName: info.fullName,
        email: info.email,
        firstName: info.firstName
      }));

      io.to(documentId).emit('user-joined', {
        userId: socket.id,
        fullName: userInfo.fullName,
        email: userInfo.email,
        firstName: userInfo.firstName,
        users
      });
    });

    socket.on('document-update', (data) => {
      if (!checkRateLimit(socket.id, 50, 1000)) {
        socket.emit('rate-limit-exceeded', { message: 'Too many updates. Please slow down.' });
        return;
      }
      
      socket.to(data.documentId).emit('document-update', {
        content: data.content,
        userId: socket.id
      });
    });

    socket.on('cursor-update', (data) => {
      if (!checkRateLimit(socket.id, 100, 1000)) {
        return;
      }
      
      socket.to(data.documentId).emit('cursor-update', {
        userId: socket.id,
        position: data.position,
        username: data.username
      });
    });

    socket.on('typing-indicator', (data) => {
      if (!checkRateLimit(socket.id, 20, 1000)) {
        return;
      }
      
      socket.to(data.documentId).emit('typing-indicator', {
        userId: socket.id,
        isTyping: data.isTyping,
        firstName: data.firstName
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      connections.forEach((users, documentId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          const remainingUsers = Array.from(users.entries()).map(([id, info]) => ({
            id,
            fullName: info.fullName,
            email: info.email,
            firstName: info.firstName
          }));
          io.to(documentId).emit('user-left', {
            userId: socket.id,
            users: remainingUsers
          });
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, '0.0.0.0', () => {
      console.log(`> Server running on port ${port}`);
    });
});
