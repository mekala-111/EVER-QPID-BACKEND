import { Document, Types } from 'mongoose';

export interface IRecentPassUsers extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  userId: Types.ObjectId;
  recentPassUser: Types.ObjectId;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
}
