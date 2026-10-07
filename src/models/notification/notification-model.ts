import { Types, Document } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  notificationType: string;
  title: string;
  description: string;
  onTapNavigate: string;
  sentOn: Date;
  sender: Types.ObjectId | null;
  documentStatus: boolean;
  viewStatus: boolean;
}
