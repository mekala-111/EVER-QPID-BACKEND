import { Document, Types } from 'mongoose';

export interface IMatching extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
  isSuperLike: boolean;
}
