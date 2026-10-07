import { Document, Types } from 'mongoose';

export interface IReport extends Document {
  reporter: Types.ObjectId;
  reported: Types.ObjectId;
  reason: string;
  warningLevel: 'low' | 'medium' | 'high';
  attemptsLeft: number;
  status: 'under_review' | 'active' | 'final_warning' | 'suspended';
  //details?: string;
  createdAt: Date;
  updatedAt: Date;
  documentStatus: boolean;
}
