import { Server, Socket } from 'socket.io';
import { chatMessageService } from '../services';
import { isHostChatBlocked } from '../utils/isHostChatBlocked';
import { userRepository } from '../repositories';

// In-memory maps
const onlineUsers = new Map<string, string>(); // userId -> socketId
const hostEmployeeMap = new Map<string, string[]>(); // hostId -> employeeIds

interface SocketAuthData {
  userId: string;
  employeeHosts?: string[];
}

interface SocketData {
  userId: string;
  hosts?: string[];
}

interface PrivateMessagePayload {
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  mediaUrl?: string;
}

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const { userId, employeeHosts } = socket.handshake.auth as SocketAuthData;
  socket.data.userId = userId;
  onlineUsers.set(userId, socket.id);

  // If employee, track hosts they manage
  if (employeeHosts && employeeHosts.length) {
    socket.data.hosts = employeeHosts;
    employeeHosts.forEach((hostId) => {
      const arr = hostEmployeeMap.get(hostId) || [];
      if (!arr.includes(userId)) arr.push(userId);
      hostEmployeeMap.set(hostId, arr);
    });
  }

  onlineUsers.set(userId, socket.id);

  const socketData = socket.data as SocketData;

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    if (socketData.hosts) {
      socketData.hosts.forEach((hostId: string) => {
        const arr = hostEmployeeMap.get(hostId) || [];
        hostEmployeeMap.set(
          hostId,
          arr.filter((id) => id !== userId),
        );
      });
    }
  });

  // Private messages
  socket.on('privateMessage', async (payload: PrivateMessagePayload): Promise<void> => {
    const { senderId, receiverId, type, content, mediaUrl } = payload;
    try {
      if (await isHostChatBlocked(senderId, receiverId)) {
        socket.emit('chatBlocked', { withUserId: receiverId, message: 'Chat blocked' });
        return;
      }

      const chat = await chatMessageService.sendMessage({ senderId, receiverId, type, content, mediaUrl });
      const isHost = await userRepository.isHost(receiverId);
      console.log('isHost:', isHost);
      console.log('receiverId:', receiverId);
      console.log('onlineUsers map:', onlineUsers);
      console.log('hostSocketId:', onlineUsers.get(receiverId));

      if (isHost) {
        const hostSocketId = onlineUsers.get(receiverId);
        if (hostSocketId) {
          console.log('Emitting to host socket:', hostSocketId);
          io.to(hostSocketId).emit('newMessage', chat);
        } else {
          console.log('Host socket not found');
        }

        const employeeIds = hostEmployeeMap.get(receiverId) || [];
        employeeIds.forEach((empId) => {
          const empSocketId = onlineUsers.get(empId);
          if (empSocketId) io.to(empSocketId).emit('newMessage', { ...chat, fromUserId: senderId, toHostId: receiverId });
        });
      } else {
        io.to(receiverId).emit('newMessage', chat);
      }

      io.to(senderId).emit('newMessage', chat);
    } catch (err) {
      console.error(err);
      socket.emit('errorMessage', { message: err instanceof Error ? err.message : 'Failed to send message' });
    }
  });

  // Employee sends message as host
  socket.on('hostMessage', async ({ hostId, userId, type, content, mediaUrl }) => {
    try {
      const chat = await chatMessageService.sendMessage({ senderId: hostId, receiverId: userId, type, content, mediaUrl, skipAuth: true });
      io.to(userId).emit('newMessage', chat);
    } catch (err) {
      console.error(err);
      socket.emit('errorMessage', { message: 'Failed to send host message' });
    }
  });

  // Message read
  socket.on('messageRead', async ({ userId, withUserId }) => {
    try {
      const readAt = new Date();
      await chatMessageService.updateLastReadStatus(userId, withUserId, readAt);
      io.to(withUserId).emit('readStatusUpdated', { userId, lastReadAt: readAt });
    } catch (err) {
      console.error(err);
      socket.emit('errorMessage', { message: 'Failed to update read status' });
    }
  });

  // Host (or employee acting as host) marks messages as read for a user
  socket.on('hostMessageRead', async ({ hostId, userId }) => {
    try {
      if (!hostId || !userId) {
        socket.emit('errorMessage', { message: 'Invalid payload for hostMessageRead' });
        return;
      }

      const readAt = new Date();

      // Update last read status in DB (host reading user messages)
      await chatMessageService.updateLastReadStatus(hostId, userId, readAt);

      // Emit to the user whose messages were read
      const userSocketId = onlineUsers.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit('readStatusUpdated', {
          userId: hostId,
          lastReadAt: readAt,
        });
      }

      // Notify other employees of the host (optional)
      const employeeIds = hostEmployeeMap.get(hostId) || [];
      employeeIds.forEach((empId) => {
        const empSocketId = onlineUsers.get(empId);
        if (empSocketId && empId !== socket.data.userId) {
          io.to(empSocketId).emit('readStatusUpdated', {
            userId: hostId,
            lastReadAt: readAt,
            toHostId: hostId,
          });
        }
      });
    } catch (err) {
      console.error('hostMessageRead error:', err);
      socket.emit('errorMessage', { message: 'Failed to mark messages read by host' });
    }
  });

  // Typing indicator
  socket.on('typing', async ({ senderId, receiverId }) => {
    if (await isHostChatBlocked(senderId, receiverId)) return;
    const isHost = await userRepository.isHost(receiverId);
    if (isHost) {
      const employeeIds = hostEmployeeMap.get(receiverId) || [];
      employeeIds.forEach((empId) => {
        const empSocketId = onlineUsers.get(empId);
        if (empSocketId) io.to(empSocketId).emit('userTyping', { senderId, toHostId: receiverId });
      });
    } else {
      io.to(receiverId).emit('userTyping', { senderId });
    }
  });

  // Employee or host typing to a user
  socket.on('hostTyping', async ({ hostId, userId }) => {
    try {
      // Check if chat is blocked
      if (await isHostChatBlocked(hostId, userId)) return;

      // Send typing indicator to the user
      io.to(userId).emit('userTyping', { senderId: hostId });

      // Optional: notify other employees of the host that host is typing
      const employeeIds = hostEmployeeMap.get(hostId) || [];
      employeeIds.forEach((empId) => {
        const empSocketId = onlineUsers.get(empId);
        if (empSocketId && empId !== socket.data.userId) {
          io.to(empSocketId).emit('userTyping', { senderId: hostId, toHostId: hostId });
        }
      });
    } catch (err) {
      console.error('HostTyping error:', err);
      socket.emit('errorMessage', { message: 'Failed to send host typing indicator' });
    }
  });

  socket.on('stopTyping', async ({ senderId, receiverId }) => {
    if (await isHostChatBlocked(senderId, receiverId)) return;
    const isHost = await userRepository.isHost(receiverId);
    if (isHost) {
      const employeeIds = hostEmployeeMap.get(receiverId) || [];
      employeeIds.forEach((empId) => {
        const empSocketId = onlineUsers.get(empId);
        if (empSocketId) io.to(empSocketId).emit('userStopTyping', { senderId, toHostId: receiverId });
      });
    } else {
      io.to(receiverId).emit('userStopTyping', { senderId });
    }
  });

  socket.on('hostStopTyping', async ({ hostId, userId }) => {
    try {
      if (await isHostChatBlocked(hostId, userId)) return;

      io.to(userId).emit('userStopTyping', { senderId: hostId });

      const employeeIds = hostEmployeeMap.get(hostId) || [];
      employeeIds.forEach((empId) => {
        const empSocketId = onlineUsers.get(empId);
        if (empSocketId && empId !== socket.data.userId) {
          io.to(empSocketId).emit('userStopTyping', { senderId: hostId, toHostId: hostId });
        }
      });
    } catch (err) {
      console.error('HostStopTyping error:', err);
      socket.emit('errorMessage', { message: 'Failed to stop host typing indicator' });
    }
  });
};
