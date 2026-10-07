import { Document } from 'mongoose';

export interface IAdminEmail extends Document {
  email: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}
