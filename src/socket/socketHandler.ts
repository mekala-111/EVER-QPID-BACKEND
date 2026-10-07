import { Server, Socket } from 'socket.io';
import { registerChatHandlers } from './chatHandler';
import {
  setUserOffline,
  setUserOnline,
  deleteManyRecentPassUsers,
} from '../repositories/profile-repository';

/**
 * userId -> Set of socketIds
 */
const userSocketsMap = new Map<string, Set<string>>();

/**
 * socketId -> userId
 */
export const userSocketMap = new Map<string, string>();

export const handleSocketEvents = (io: Server, socket: Socket): void => {
  /**
   * JOIN USER ROOM
   */
  socket.on('joinUserRoom', async (payload: { data: string }) => {
    try {
      const userId = payload.data;

      if (!userId) {
        console.log('⚠️ Invalid userId received');
        return;
      }

      socket.join(userId);

      /**
       * Map socket -> user
       */
      userSocketMap.set(socket.id, userId);

      /**
       * Map user -> sockets
       */
      if (!userSocketsMap.has(userId)) {
        userSocketsMap.set(userId, new Set());
      }

      userSocketsMap.get(userId)!.add(socket.id);

      /**
       * Set user online
       */
      await setUserOnline(userId);

      io.emit('userStatusChanged', {
        userId,
        isOnline: true,
      });

      console.log(
        `👤 User [${userId}] joined via socket [${socket.id}]`
      );
    } catch (error) {
      console.error('❌ Failed to handle joinUserRoom:', error);
    }
  });

  /**
   * REGISTER CHAT HANDLERS
   */
  registerChatHandlers(io, socket);

  /**
   * DISCONNECT
   */
  socket.on('disconnect', async () => {
    try {
      const socketId = socket.id;

      const userId = userSocketMap.get(socketId);

      if (!userId) {
        console.log(
          `Socket disconnected (no user mapped): ${socketId}`
        );
        return;
      }

      const sockets = userSocketsMap.get(userId);

      if (!sockets) {
        return;
      }

      /**
       * Remove this socket
       */
      sockets.delete(socketId);

      /**
       * Remove socket mapping
       */
      userSocketMap.delete(socketId);

      /**
       * If no active sockets → user fully offline
       */
      if (sockets.size === 0) {
        console.log(`🔄 Cleaning user data for ${userId}`);

        await Promise.all([
          setUserOffline(userId),
          deleteManyRecentPassUsers(userId),
        ]);

        io.emit('userStatusChanged', {
          userId,
          isOnline: false,
          lastActive: new Date(),
        });

        userSocketsMap.delete(userId);

        console.log(`⚫ User ${userId} is now OFFLINE`);
      }
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  });
};