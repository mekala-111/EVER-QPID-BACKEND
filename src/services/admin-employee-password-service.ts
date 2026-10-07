import * as argon2 from 'argon2';
import { adminRepository, authRepository, employeeRepository } from '../repositories';
import ERROR from '../middlewares/web_server/http-error';
import { sendOTPEmail } from '../utils/forgot-password-email';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Forgot Password (Admin + Employee)
 */
const forgotPassword = async (email: string) => {
  const result = await authRepository.findUserByEmail(email);
  if (!result) throw new ERROR.NotFoundError('Email not found');

  const { userType } = result;

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  if (userType === 'admin') {
    await adminRepository.updateOtp(email, otp, otpExpiry);
  } else {
    await employeeRepository.updateOtp(email, otp, otpExpiry);
  }

  await sendOTPEmail(email, otp);
  return true;
};

/**
 * Verify OTP
 */
const verifyOtp = async (email: string, otp: string) => {
  const result = await authRepository.findUserByEmail(email);
  if (!result) throw new ERROR.NotFoundError('Email not found');

  const { user } = result;

  if (!user.otp || !user.otpExpiry) {
    throw new ERROR.InvalidInputError('OTP not generated');
  }

  if (user.otp !== otp) {
    throw new ERROR.InvalidInputError('Incorrect OTP');
  }

  if (new Date() > user.otpExpiry) {
    throw new ERROR.InvalidInputError('OTP expired');
  }

  return true;
};

/**
 * Set New Password
 */
const setNewPassword = async (email: string, newPassword: string) => {
  const result = await authRepository.findUserByEmail(email);
  if (!result) throw new ERROR.NotFoundError('Email not found');

  const hashedPassword = await argon2.hash(newPassword);

  if (result.userType === 'admin') {
    await adminRepository.resetPassword(email, hashedPassword);
  } else {
    await employeeRepository.resetPassword(email, hashedPassword);
  }

  return true;
};

export default {
  forgotPassword,
  verifyOtp,
  setNewPassword,
};
