import { Model, Schema, model } from 'mongoose';
import { IOTP } from './otp-model';

const otpSchema: Schema = new Schema<IOTP>(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 }); //expires after 5 minutes

const OTP: Model<IOTP> = model<IOTP>('cln_otps', otpSchema);

export default OTP;
