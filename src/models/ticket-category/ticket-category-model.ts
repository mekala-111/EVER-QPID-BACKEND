import { Document, Types } from 'mongoose';

export interface ITicketCategory extends Document {
  _id: Types.ObjectId;
  categoryName: string;
  documentStatus: boolean;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
  adminId: string;
}
