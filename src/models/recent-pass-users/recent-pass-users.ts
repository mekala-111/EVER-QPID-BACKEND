import { Model, Schema, model } from 'mongoose';
import { IRecentPassUsers } from './recent-pass-users-model';

const recentPassUsersSchema: Schema = new Schema<IRecentPassUsers>({
  documentStatus: { type: Boolean, required: true, default: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'cln_user' },
  recentPassUser: { type: Schema.Types.ObjectId, required: true, ref: 'cln_user' },
  createdUser: { type: Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Schema.Types.ObjectId, default: null },
  updatedAt: { type: Date, default: null },
});

// Update the `updatedAt` field before saving the document

recentPassUsersSchema.pre<IRecentPassUsers>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const RECENT_PASS_USERS: Model<IRecentPassUsers> = model<IRecentPassUsers>('cln_recent_pass_users', recentPassUsersSchema);

export default RECENT_PASS_USERS;
