import { Document, Types } from 'mongoose';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  adminUserName: string;
  adminUserType: string;
  email: string;
  password: string;
  otp: string | null;
  otpExpiry: Date | null;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
}
