import { Document, Types } from 'mongoose';

export interface IPushNotification extends Document {
  documentStatus: boolean;
  title: string;
  description: string;
  notificationType: string;
  link: string;
  imageUrl: string;
  notificationUrl: string;
  recipients: string[];
  fromDate: Date;
  toDate: Date;
  interval: number;
  time: string;
  paused: boolean;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
}
