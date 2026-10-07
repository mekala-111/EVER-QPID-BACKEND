import { Model, Schema, model } from 'mongoose';
import { IAdminEmail } from './admin-email-model';

const adminEmailSchema: Schema = new Schema<IAdminEmail>({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the `updatedAt` field before saving the document

adminEmailSchema.pre<IAdminEmail>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const ADMINEMAIL: Model<IAdminEmail> = model<IAdminEmail>('cln_adminemail', adminEmailSchema);

export default ADMINEMAIL;
