import { Document, Types } from 'mongoose';

export interface IChatReadStatus extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  withUserId: Types.ObjectId;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
