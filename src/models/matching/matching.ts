import { Model, Schema, model } from 'mongoose';
import { IMatching } from './matching-model';

const matchingSchema: Schema = new Schema<IMatching>(
  {
    documentStatus: { type: Boolean, required: true, default: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    createdUser: { type: Schema.Types.ObjectId, ref: 'cln_user', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedUser: { type: Schema.Types.ObjectId, ref: 'cln_user', default: null },
    updatedAt: { type: Date, default: Date.now },
    isSuperLike: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Define model
const MATCHING: Model<IMatching> = model<IMatching>('cln_Matching', matchingSchema);
export default MATCHING;
