const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const documents = new Map();
const connections = new Map();

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

    socket.on('join-document', (documentId, username) => {
      socket.join(documentId);
      
      if (!connections.has(documentId)) {
        connections.set(documentId, new Map());
      }
      connections.get(documentId).set(socket.id, username || `User ${socket.id.slice(0, 4)}`);

      const users = Array.from(connections.get(documentId).entries()).map(([id, name]) => ({
        id,
        username: name
      }));

      io.to(documentId).emit('user-joined', {
        userId: socket.id,
        username: username || `User ${socket.id.slice(0, 4)}`,
        users
      });
    });

    socket.on('document-update', (data) => {
      socket.to(data.documentId).emit('document-update', {
        content: data.content,
        userId: socket.id
      });
    });

    socket.on('cursor-update', (data) => {
      socket.to(data.documentId).emit('cursor-update', {
        userId: socket.id,
        position: data.position,
        username: data.username
      });
    });

    socket.on('typing-indicator', (data) => {
      socket.to(data.documentId).emit('typing-indicator', {
        userId: socket.id,
        isTyping: data.isTyping,
        username: data.username
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      connections.forEach((users, documentId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          const remainingUsers = Array.from(users.entries()).map(([id, name]) => ({
            id,
            username: name
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
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
