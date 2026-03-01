import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import * as Y from 'yjs';

const documents = new Map<string, Y.Doc>();
const connections = new Map<string, Set<string>>();

export function setupWebSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-document', (documentId: string, username: string) => {
      socket.join(documentId);
      
      if (!connections.has(documentId)) {
        connections.set(documentId, new Set());
      }
      connections.get(documentId)!.add(socket.id);

      // Broadcast user joined
      io.to(documentId).emit('user-joined', {
        userId: socket.id,
        username: username || `User ${socket.id.slice(0, 4)}`,
        timestamp: Date.now()
      });

      // Send current users list
      const users = Array.from(connections.get(documentId) || []);
      socket.emit('users-list', users);
    });

    socket.on('document-update', (data: { documentId: string; content: any; update: Uint8Array }) => {
      // Broadcast to all other clients in the room
      socket.to(data.documentId).emit('document-update', {
        content: data.content,
        update: data.update,
        userId: socket.id
      });
    });

    socket.on('cursor-update', (data: { documentId: string; position: number; username: string }) => {
      socket.to(data.documentId).emit('cursor-update', {
        userId: socket.id,
        position: data.position,
        username: data.username
      });
    });

    socket.on('typing-indicator', (data: { documentId: string; isTyping: boolean; username: string }) => {
      socket.to(data.documentId).emit('typing-indicator', {
        userId: socket.id,
        isTyping: data.isTyping,
        username: data.username
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from all document connections
      connections.forEach((users, documentId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          io.to(documentId).emit('user-left', {
            userId: socket.id,
            timestamp: Date.now()
          });
        }
      });
    });
  });

  return io;
}
