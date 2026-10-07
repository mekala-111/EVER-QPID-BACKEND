import { Document, Types } from 'mongoose';

export interface IIntrest extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  interest: string;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
}
