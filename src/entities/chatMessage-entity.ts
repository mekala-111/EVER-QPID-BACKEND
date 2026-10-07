import { Types } from 'mongoose';
class ChatMessageEntity {
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  mediaUrl: string;
  isRead: boolean;
  sentAt: Date | null;
  documentStatus: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedBy: Types.ObjectId | null;
  constructor(
    senderId: string,
    receiverId: string,
    type: 'text' | 'image' | 'audio' | 'video',
    content: string = '',
    mediaUrl: string = '',
    isRead: boolean = false,
    sentAt: Date | null = null,
    documentStatus: boolean = true,
    createdAt: Date | null = null,
    updatedAt: Date | null = null,
    deletedBy: Types.ObjectId | null,
  ) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.type = type;
    this.content = content;
    this.mediaUrl = mediaUrl;
    this.isRead = isRead;
    this.sentAt = sentAt;
    this.documentStatus = documentStatus;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedBy = deletedBy;
  }
}

export default ChatMessageEntity;
