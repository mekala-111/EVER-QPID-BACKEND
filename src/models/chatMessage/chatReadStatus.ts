import { Schema, model, Model } from 'mongoose';
import { IChatReadStatus } from './chatReadStatus-model';

const chatReadStatusSchema = new Schema<IChatReadStatus>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'cln_users', required: true },
    withUserId: { type: Schema.Types.ObjectId, ref: 'cln_users', required: true },
    lastReadAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Unique index for 1:1 relation between user and chat partner
chatReadStatusSchema.index({ userId: 1, withUserId: 1 }, { unique: true });

const CHATREADSTATUS: Model<IChatReadStatus> = model<IChatReadStatus>('cln_chatReadStatus', chatReadStatusSchema);
export default CHATREADSTATUS;
