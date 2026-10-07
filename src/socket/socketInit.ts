import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { handleSocketEvents } from './socketHandler';

let io: SocketIOServer;

export const initializeSocketIO = (server: HTTPServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  console.log('✅ Socket.IO initialized');

  io.on('connection', (socket: Socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    handleSocketEvents(io, socket);
  });
};

export const getSocketIOInstance = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }

  return io;
};