import { Document, Types } from 'mongoose';

export interface IFavourite extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  userId: Types.ObjectId;
  favProfileId: Types.ObjectId;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
  isPined: boolean;
  pinedOn: Date | null;
}
