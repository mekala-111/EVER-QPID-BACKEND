import mongoose, { Document } from 'mongoose';

export interface ISupport extends Document {
  documentStatus: boolean;
  userId: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  //phoneNumber: string;
  category: string;
  subject: string;
  //category: mongoose.Types.ObjectId;
  //type?: string;
  description: string;
  attachments?: string[];
  status: 'open' | 'closed';
  assignedTo?: mongoose.Types.ObjectId | null;
  priority: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}
