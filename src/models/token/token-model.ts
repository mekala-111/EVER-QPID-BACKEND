import { Document, Types } from 'mongoose';

export interface IToken extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  token: string;
  user: Types.ObjectId;
  type: string;
  expires: Date;
  blacklisted: boolean;
}
