import { Document, Types } from 'mongoose';

export type MessageType = 'text' | 'image' | 'audio' | 'video';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  type: MessageType;
  content: string | null;
  mediaUrl: string | null;
  isRead: boolean;
  sentAt: Date | null;
  documentStatus: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedBy: Types.ObjectId | null;
}
