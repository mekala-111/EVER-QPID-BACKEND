import { Types } from 'mongoose';
import MessageEntity from '../entities/message-entity';
import MESSAGE from '../models/message/message';

const create = async (messageEntity: MessageEntity): Promise<MessageEntity> => {
  const doc = await MESSAGE.create({
    from: messageEntity.from,
    to: messageEntity.to,
    content: messageEntity.content,
    read: messageEntity.read,
    sentOn: messageEntity.sentOn,
  });

  return new MessageEntity(doc._id, doc.from, doc.to, doc.content, doc.read, doc.createdAt);
};

const findByUser = async (userId: string): Promise<MessageEntity[]> => {
  const docs = await MESSAGE.find({ to: new Types.ObjectId(userId) })
    .sort({ sentOn: -1 })
    .populate('from', 'adminUserName email');

  return docs.map((doc) => new MessageEntity(doc._id, doc.from._id, doc.to, doc.content, doc.read, doc.createdAt));
};

const markAsRead = async (messageId: string, userId: string): Promise<MessageEntity | null> => {
  const doc = await MESSAGE.findOneAndUpdate({ _id: new Types.ObjectId(messageId), to: new Types.ObjectId(userId) }, { read: true }, { new: true });

  if (!doc) return null;
  return new MessageEntity(doc._id, doc.from, doc.to, doc.content, doc.read, doc.createdAt);
};

export default { create, findByUser, markAsRead };
