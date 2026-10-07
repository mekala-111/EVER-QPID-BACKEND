import ChatMessageEntity from '../entities/chatMessage-entity';
import { IChatMessage } from '../models/chatMessage/chatMessage-model';
import { chatMessageRepository, userRepository } from '../repositories';
import { validateBadRequest, validateRequiredField, validateUserAuthorization } from '../utils/validators';
import notificationService from '../services/notification-service';
import { RecentChatsResult } from '../types/chat';
import config from '../config/config';
import { sendPushNotification } from './push-notifications-service';
import { Types } from 'mongoose';
/**
 * Service: Send a message from one user to another
 * @param {Object} params
 * @param {string} params.senderId
 * @param {string} params.receiverId
 * @param {string} params.message
 * @returns {Promise<IChatMessage>}
 */
const sendMessage = async ({
  senderId,
  receiverId,
  type,
  content,
  mediaUrl,
  skipAuth = false,
  //token,
}: {
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  mediaUrl?: string;
  skipAuth?: boolean;
}): Promise<IChatMessage> => {
  if (!skipAuth) validateUserAuthorization(senderId);
  validateRequiredField(receiverId, 'receiverId');

  validateBadRequest(senderId === receiverId, 'Sender and receiver must be different users');

  const sender = await userRepository.getUserBasicInfo(senderId);

  const isWoman = sender?.gender === 'Women';

  if (!isWoman) {
    const subscriptionStatus = await userRepository.getSubscriptionStatus(senderId);

    if (subscriptionStatus !== 'Active') {
      const sentCount = await chatMessageRepository.countMessagesBetweenUsers(senderId, receiverId);

      if (sentCount >= config.chat.freeMessageLimit) {
        validateBadRequest(true, 'Please subscribe to continue chatting');
      }
    }
  }

  if (type === 'text' && !content) {
    validateBadRequest(true, 'Content is required for text messages');
  }

  if (type !== 'text' && !mediaUrl) {
    validateBadRequest(true, `${type} message requires mediaUrl`);
  }
  const fromUserDetails = await userRepository.findUserById(new Types.ObjectId(senderId));
  const chatEntity = new ChatMessageEntity(
    senderId,
    receiverId,
    type,
    content || '',
    mediaUrl || '',
    false,
    new Date(),
    true,
    new Date(),
    new Date(),
    null,
  );
  await notificationService.createNotification(receiverId, 'chat', 'New message received', 'You have a new message.', 'chat', null);
  await sendPushNotification(receiverId, 'new_message', `${fromUserDetails?.fullName}`, senderId);
  return await chatMessageRepository.create(chatEntity);
};

/**
 * Service: Get all chat messages for a user
 * @param {string} userId - The ID of the logged-in user
 * @param {{ pageNumber: number; pageSize: number }} pagination
 * @returns {Promise<{ messages: IChatMessage[]; totalCount: number; hasNext: boolean }>}
 */
const getMessagesBetweenUsers = async (senderId: string, receiverId: string): Promise<{ data: IChatMessage[]; totalCount: number }> => {
  validateUserAuthorization(senderId);
  validateBadRequest(senderId === receiverId, 'Sender and receiver must be different users');

  return await chatMessageRepository.getMessagesBetweenUsers(senderId, receiverId);
};

/**
 * Set the last read timestamp for a user-to-user conversation.
 */
const updateLastReadStatus = async (userId: string, withUserId: string, readAt: Date): Promise<void> => {
  validateUserAuthorization(userId);
  await chatMessageRepository.upsertLastReadStatus(userId, withUserId, readAt);
};

/**
 * Get last read timestamp for a user-to-user conversation.
 */
const getLastReadStatus = async (userId: string, withUserId: string) => {
  validateUserAuthorization(userId);
  return await chatMessageRepository.getLastReadStatus(userId, withUserId);
};

/**
 * Service: getRecentChats
 * @param {string} userId -
 * @returns {Promise<IChatMessage>}
 */
const getRecentChats = async (userId: string, search: string, pageNumber: number, pageSize: number): Promise<RecentChatsResult> => {
  validateUserAuthorization(userId);

  return await chatMessageRepository.getRecentChats(userId, search, pageNumber, pageSize);
};
/**
 * Clear chat
 * @param conversationId
 */

const deleteMessages = async (userId: string, chatWith: string) => {
  await chatMessageRepository.clearMessageHistory(userId, chatWith);
};

const deleteAllMessages = async (userId: string, chatWith: string) => {
  await chatMessageRepository.deleteAllMessages(userId, chatWith);
};

const getRecentChatsByAdmin = async (userId: string) => {
  validateUserAuthorization(userId);

  return await chatMessageRepository.getRecentChatsByAdmin(userId);
};

const getChatHistoryForAdmin = async (hostId: string, userId: string, pageNumber: number, pageSize: number) => {
  validateUserAuthorization(hostId);
  validateUserAuthorization(userId);

  return await chatMessageRepository.getChatHistoryBetweenUsers(hostId, userId, pageNumber, pageSize);
};

const getRecentChatsForAdmin = async (search: string, pageNumber: number, pageSize: number) => {
  return await chatMessageRepository.getRecentChatsForAdmin(search, pageNumber, pageSize);
};

interface FetchChatsServiceOptions {
  hostId: string;
  userId: string;
  pageNumber?: number;
  pageSize?: number;
}

const getHostUserChats = async ({ hostId, userId, pageNumber = 1, pageSize = 20 }: FetchChatsServiceOptions) => {
  const skip = (pageNumber - 1) * pageSize;
  const chats = await chatMessageRepository.fetchHostUserChatsRepo({ hostId, userId, skip, limit: pageSize });
  return chats;
};

const markChatAsRead = async (userId: string, withUserId: string): Promise<void> => {
  validateUserAuthorization(userId);
  validateBadRequest(userId === withUserId, 'Invalid chat');

  await chatMessageRepository.markChatAsRead(userId, withUserId);
};

export default {
  sendMessage,
  getMessagesBetweenUsers,
  updateLastReadStatus,
  getLastReadStatus,
  getRecentChats,
  deleteMessages,
  deleteAllMessages,
  getRecentChatsByAdmin,
  getChatHistoryForAdmin,
  getRecentChatsForAdmin,
  getHostUserChats,
  markChatAsRead,
};
