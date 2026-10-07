import { Types, Document } from 'mongoose';

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'Manager' | 'Chat Support' | 'Customer Support' | 'Marketing';
  authorityLevel: 'Full Access' | 'View Access' | 'Edit Access' | 'View & Edit Access';
  password: string;
  otp: string;
  otpExpiry: Date;
  createdByAdmin: string | Types.ObjectId;
  createdAt: Date;
  documentStatus: boolean;
  updatedUser?: Types.ObjectId | null;
  updatedAt?: Date | null;
  //assignedHosts?: IUser[];

  isLoggedIn: boolean;
  lastLoginAt?: Date | null;
  lastLogoutAt?: Date | null;
}
