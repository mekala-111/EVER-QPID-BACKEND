import { Schema, model, Model } from 'mongoose';
import { INotification } from './notification-model';

// Define Notification schema
const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'cln_users',
  },
  notificationType: {
    type: String,
    required: true,
    enum: ['like', 'new_match', 'low_balance', 'subcription', 'chat', 'others'],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  onTapNavigate: {
    type: String,
    required: true,
    enum: ['myProfile', 'otherProfile', 'chat', 'subscription', 'matchScreen'],
  },
  sentOn: {
    type: Date,
    default: Date.now,
  },
  sender: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: 'cln_users',
  },
  documentStatus: {
    type: Boolean,
    required: true,
    default: true,
  },
  viewStatus: {
    type: Boolean,
    default: false,
  },
});

// Create and export the Notification model
const Notification: Model<INotification> = model<INotification>('cln_notifications', NotificationSchema);

export default Notification;
