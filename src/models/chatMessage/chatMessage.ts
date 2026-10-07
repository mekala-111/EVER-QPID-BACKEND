import { Schema, model, Model } from 'mongoose';
import { IChatMessage } from './chatMessage-model'; // update path if needed

const chatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'video'],
      required: true,
    },
    content: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    documentStatus: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'cln_users', default: null },
  },
  {
    timestamps: true, // will auto-manage createdAt/updatedAt
  },
);

// Remove manual `createdAt` handling since `timestamps` is used
chatMessageSchema.pre<IChatMessage>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const CHATSMESSAGES: Model<IChatMessage> = model<IChatMessage>('cln_chatsMessages', chatMessageSchema);

export default CHATSMESSAGES;
