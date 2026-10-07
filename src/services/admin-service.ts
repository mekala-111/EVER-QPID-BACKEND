import AdminEntity from '../entities/admin-entity';
import ERROR from '../middlewares/web_server/http-error';
import { IAdmin } from '../models/admin/admin-model';
import * as argon2 from 'argon2';
import adminRepository from '../repositories/admin-repository';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../utils/forgot-password-email';
import { employeeRepository } from '../repositories';
import EMPLOYEE from '../models/employee/employee';

/**
 * Create an admin
 * @param {String} adminUserName
 * @param {String} adminUserType
 * @param {String} email
 * @param {String} password
 * @returns {Promise<IAdmin>}
 */
const createAdmin = async (adminUserName: string, adminUserType: string, email: string, password: string): Promise<IAdmin> => {
  if (await adminRepository.isEmailTaken(email)) {
    throw new ERROR.DocumentExistsError('Email already taken!');
  }
  const hash = await argon2.hash(password);
  const adminEntity: AdminEntity = new AdminEntity(true, adminUserName, adminUserType, email, hash, null, new Date(), null, new Date());
  return await adminRepository.create(adminEntity);
};

/**
 *
 * @param { String } email
 * @param { String } password
 */
const login = async (email: string, password: string) => {
  /**
   * 1️⃣ Check Admin
   */
  const admin = await adminRepository.findByEmail(email);

  if (admin && admin._id) {
    if (!(await argon2.verify(admin.password, password))) {
      throw new ERROR.InvalidInputError('Incorrect password!');
    }

    const tokenData = {
      id: admin._id,
      role: 'admin',
      userName: admin.adminUserName,
      email: admin.email,
    };

    const accessToken = jwt.sign(tokenData, process.env.JWT_SECRET as string);

    return {
      userType: 'admin',
      role: 'admin',
      user: {
        id: admin._id,
        userName: admin.adminUserName,
        email: admin.email,
        adminUserType: admin.adminUserType,
        documentStatus: admin.documentStatus,
        status: 'Active',
        role: 'admin',
      },
      accessToken,
    };
  }

  /**
   * 2️⃣ Check Employee
   */
  const employee = await employeeRepository.getByEmail(email);

  if (employee && employee._id) {
    if (!employee.password) {
      throw new ERROR.InvalidInputError('Password not set. Please use forgot password.');
    }

    if (!(await argon2.verify(employee.password, password))) {
      throw new ERROR.InvalidInputError('Incorrect password!');
    }

    const tokenData = {
      id: employee._id,
      role: 'employee',
      employeeRole: employee.role,
      authorityLevel: employee.authorityLevel,
      email: employee.email,
    };

    await EMPLOYEE.findByIdAndUpdate(employee._id, {
      isLoggedIn: true,
      lastLoginAt: new Date(),
    });

    const accessToken = jwt.sign(tokenData, process.env.JWT_SECRET as string);

    return {
      userType: 'employee',
      role: employee.role,
      user: {
        id: employee._id,
        email: employee.email,
        role: employee.role,
        authorityLevel: employee.authorityLevel,
        status: 'Active',
      },
      accessToken,
    };
  }

  /**
   * 3️⃣ Not found
   */
  throw new ERROR.NotFoundError('Email not found!');
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const forgotPassword = async (email: string) => {
  const admin = await adminRepository.findByEmail(email);

  if (!admin) {
    throw new ERROR.NotFoundError('Email not found');
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await adminRepository.updateOtp(email, otp, otpExpiry);

  await sendOTPEmail(email, otp);

  return true;
};

const verifyOtp = async (email: string, otp: string) => {
  const admin = await adminRepository.findByEmail(email);
  if (!admin) throw new ERROR.NotFoundError('Email not found');
  if (!admin.otp || !admin.otpExpiry) throw new ERROR.InvalidInputError('OTP not generated');
  if (admin.otp !== otp) throw new ERROR.InvalidInputError('Incorrect OTP');
  if (new Date() > admin.otpExpiry) throw new ERROR.InvalidInputError('OTP expired');

  return true;
};

const setNewPassword = async (email: string, newPassword: string) => {
  const admin = await adminRepository.findByEmail(email);
  if (!admin) throw new ERROR.NotFoundError('Email not found');

  const hashedPassword = await argon2.hash(newPassword);
  await adminRepository.resetPassword(email, hashedPassword);

  return true;
};

export default {
  createAdmin,
  login,
  forgotPassword,
  verifyOtp,
  setNewPassword,
};
