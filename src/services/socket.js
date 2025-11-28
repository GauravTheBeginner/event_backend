import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*', // Allow all origins for now or specify frontend URL
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (eventId) => {
      socket.join(eventId);
      console.log(`User ${socket.id} joined room: ${eventId}`);
    });

    socket.on('leave_room', (eventId) => {
      socket.leave(eventId);
      console.log(`User ${socket.id} left room: ${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
