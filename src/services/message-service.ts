import { Types } from 'mongoose';
import MessageEntity from '../entities/message-entity';
import messageRepository from '../repositories/message-repository';
import { sendPushNotification } from './push-notifications-service';

const sendMessage = async (fromAdminId: string, toUserId: string, content: string) => {
  const message = new MessageEntity(new Types.ObjectId(), new Types.ObjectId(fromAdminId), new Types.ObjectId(toUserId), content, false, new Date());

  const savedMessage = await messageRepository.create(message);

  await sendPushNotification(toUserId, 'new_message', content, fromAdminId);

  return savedMessage;
};

const getUserMessages = async (userId: string) => {
  return messageRepository.findByUser(userId);
};

const readMessage = async (messageId: string, userId: string) => {
  return messageRepository.markAsRead(messageId, userId);
};

export default { sendMessage, getUserMessages, readMessage };
