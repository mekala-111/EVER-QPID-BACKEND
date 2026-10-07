import { IEmployee } from './employee-model';
import { Schema, model, Model } from 'mongoose';

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: ['Manager', 'Chat Support', 'Customer Support', 'Marketing'],
      required: true,
    },

    authorityLevel: {
      type: String,
      enum: ['Full Access', 'View Access', 'Edit Access', 'View & Edit Access'],
      required: true,
    },
    password: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    createdByAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'cln_admins',
      required: true,
    },
    documentStatus: { type: Boolean, default: true },

    isLoggedIn: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    lastLogoutAt: { type: Date, default: null },

    updatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'cln_admins',
      default: null,
    },
    updatedAt: { type: Date, default: null },
    //assignedHosts: [{ type: Schema.Types.ObjectId, ref: 'cln_user', default: [] }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const EMPLOYEE: Model<IEmployee> = model<IEmployee>('cln_employee', employeeSchema);
export default EMPLOYEE;
