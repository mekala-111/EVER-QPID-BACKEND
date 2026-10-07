import { Request, Response, NextFunction } from 'express';
import { IAdmin } from '../models/admin/admin-model';
import ApiResponse from '../utils/api-response';
import { adminService } from '../services';
import adminEmployeePasswordService from '../services/admin-employee-password-service';

/**
 * Create an admin
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const addAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserName, adminUserType, email, password } = req.body;
    const adminUser: IAdmin = await adminService.createAdmin(adminUserName, adminUserType, email, password);

    const apiRespose: ApiResponse<{ admin: IAdmin }> = new ApiResponse<{ admin: IAdmin }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { admin: adminUser };
    apiRespose.statusCode = 201;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Admin login
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const { user, userType, accessToken } = await adminService.login(email, password);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Login successful';
    apiResponse.statusCode = 200;
    apiResponse.data = { userType, user, accessToken };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await adminEmployeePasswordService.forgotPassword(email);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'OTP sent successfully';
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const isValid = await adminEmployeePasswordService.verifyOtp(email, otp);

    const apiResponse = new ApiResponse();
    apiResponse.message = isValid ? 'OTP verified successfully' : 'Invalid OTP';
    apiResponse.statusCode = isValid ? 200 : 400;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const setNewPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;
    await adminEmployeePasswordService.setNewPassword(email, newPassword);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Password reset successfully';
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

export default {
  addAdmin,
  login,
  forgotPassword,
  verifyOtp,
  setNewPassword,
};
