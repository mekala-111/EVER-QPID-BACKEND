import { Schema, model, Model, Types } from 'mongoose';
import { IIntrest } from './interest-model';

const interestSchema = new Schema<IIntrest>(
  {
    documentStatus: { type: Boolean, required: true, default: true },
    interest: { type: String, required: true },
    createdUser: { type: Types.ObjectId, ref: 'USER', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedUser: { type: Types.ObjectId, ref: 'USER', default: null },
    updatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const INTEREST: Model<IIntrest> = model<IIntrest>('cln_interest', interestSchema);
export default INTEREST;
