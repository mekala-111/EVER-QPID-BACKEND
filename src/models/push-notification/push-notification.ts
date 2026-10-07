import { Model, Schema, model, Types } from 'mongoose';
import { IPushNotification } from './push-notification-model';

// Define the notifications schema
const pushNotificationsSchema: Schema<IPushNotification> = new Schema<IPushNotification>({
  documentStatus: { type: Boolean, required: true, default: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  notificationType: { type: String, required: true },
  link: { type: String },
  imageUrl: { type: String },
  notificationUrl: { type: String },
  recipients: [{ type: String }],
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  interval: { type: Number, required: true },
  time: { type: String, required: true },
  paused: { type: Boolean, default: false },
  createdUser: { type: Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Types.ObjectId, ref: 'User', default: null },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update the `updatedAt` field automatically
pushNotificationsSchema.pre<IPushNotification>('save', function (next) {
  this.createdAt = new Date();
  next();
});

// Create and export the Notifications model
const PUSH_NOTIFICATIONS: Model<IPushNotification> = model<IPushNotification>('cln_push_notifications', pushNotificationsSchema);

export default PUSH_NOTIFICATIONS;
