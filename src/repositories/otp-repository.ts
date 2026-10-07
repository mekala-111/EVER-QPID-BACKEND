import { OTPEntity } from '../entities/otp-entity';
import OTP from '../models/otp/otp';
import { IOTP } from '../models/otp/otp-model';

/**
 * Add new otp to the database
 * @param {OTPEntity} otpEntity
 * @returns {Promise<IOTP>}
 */
const createOTP = async (otpEntity: OTPEntity): Promise<IOTP> => {
  const otp = await new OTP(otpEntity).save();
  return otp;
};

/**
 * @function find otp by email
 * @param email
 * @returns
 */
const findOTPByEmail = async (email: string) => {
  return await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
};

/**
 * @function verify otp
 * @param email
 * @returns
 */
const verifyOTP = async (email: string, otp: string) => {
  return await OTP.findOne({ email, otp }).sort({ createdAt: -1 });
};

export default {
  createOTP,
  findOTPByEmail,
  verifyOTP,
};
