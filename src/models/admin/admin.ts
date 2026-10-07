import { Model, Schema, model } from 'mongoose';
import { IAdmin } from './admin-model';

const adminSchema: Schema = new Schema<IAdmin>({
  documentStatus: { type: Boolean, required: true, default: true },
  adminUserName: { type: String, required: true, default: '' },
  adminUserType: { type: String, required: true, default: 'admin' },
  email: { type: String, required: true },
  password: { type: String, required: true },

  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  createdUser: { type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Schema.Types.ObjectId },
  updatedAt: { type: Date, default: Date.now },
});

// Update the `updatedAt` field before saving the document

adminSchema.pre<IAdmin>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const ADMIN: Model<IAdmin> = model<IAdmin>('cln_admins', adminSchema);

export default ADMIN;
