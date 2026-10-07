import { Schema, model, Model } from 'mongoose';
import { IBlock, SelectedReasons } from './block-model';

const blockSchema = new Schema<IBlock>({
  documentStatus: { type: Boolean, required: true, default: true },
  blockedAccount: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
  blockedBy: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
  dateBlocked: { type: Date, default: null },
  selectedReasons: { type: [String], enum: Object.values(SelectedReasons), required: true },
  createdUser: { type: Schema.Types.ObjectId, ref: 'cln_user', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Schema.Types.ObjectId, ref: 'cln_user', default: null },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to set `updatedAt` before saving the document
blockSchema.pre<IBlock>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const BLOCK: Model<IBlock> = model<IBlock>('Block', blockSchema);

export default BLOCK;
