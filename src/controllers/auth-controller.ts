import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/user/user-model';
import ApiResponse from '../utils/api-response';
import { authService, fcmTokenService, tokenService } from '../services';
import ERROR from '../middlewares/web_server/http-error';
import { compareFacesFromUrls } from '../utils/face-rekognition';
import USER from '../models/user/user';
/**
 * Login
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    let fcmToken: string = '';
    if (req.headers['fcm-token']) fcmToken = req.headers['fcm-token'] as string;
    //authenticate user
    const userData: any = await authService.authUser(obj);
    //generate token
    const tokenData = await tokenService.generateAuthTokens(userData, 'user');
    //save fcm token
    if (fcmToken) {
      await fcmTokenService.saveFCMToken(userData._id.toString(), fcmToken);
    }
    //send response
    const apiRespose: ApiResponse<{ user: IUser; tokens: any }> = new ApiResponse<{ user: IUser; tokens: any }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { user: userData, tokens: tokenData };
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Check user exists
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const checkUserExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    //authenticate user
    const userExistsResponse = await authService.findUserExists(obj);
    //send response
    const authUserResponse: ApiResponse<{ userExists: boolean }> = new ApiResponse<{ userExists: boolean }>();
    authUserResponse.message = 'Success!';
    authUserResponse.data = { userExists: userExistsResponse };
    res.json(authUserResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Check user exists
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const checkUserNameExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    //authenticate user
    const userExistsResponse = await authService.findUserNameExists(obj);
    //send response
    const authUserResponse: ApiResponse<{ userNameExists: boolean }> = new ApiResponse<{ userNameExists: boolean }>();
    authUserResponse.message = 'Success!';
    authUserResponse.data = { userNameExists: userExistsResponse };
    res.json(authUserResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const logOutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];
    const { refreshToken } = req.body;

    if (!accessToken || !refreshToken) {
      throw new ERROR.AuthorizationError('Tokens missing');
    }

    await authService.logOut(refreshToken, accessToken);

    res.status(200).json({
      statusCode: 200,
      message: 'Logged out successfully',
      data: {},
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Refresh token
 * @param req
 * @param res
 * @param next
 */
const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    const apiRespose: ApiResponse<{ tokens: any }> = new ApiResponse<{ tokens: any }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { tokens: tokens };
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Check Face Recognition
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const checkFaceRecognition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw new ERROR.AuthorizationError('User not authenticated');
    }

    const { imageUrl1, imageUrl2, gender } = req.body;
    console.log('hellooo');

    if (!imageUrl1 || !imageUrl2) {
      throw new ERROR.BadRequestError('Missing required fields: imageUrl1, imageUrl2, or gender');
    }

    // Perform Face Recognition
    const { isFaceMatch, genderMatches } = await compareFacesFromUrls(imageUrl1, imageUrl2, gender);

    if (isFaceMatch && genderMatches) {
      await USER.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
    }

    const apiRespose: ApiResponse<{ isFaceMatch: boolean; genderMatches: boolean }> = new ApiResponse();
    apiRespose.message = 'Face and gender match!';
    apiRespose.data = { isFaceMatch, genderMatches };
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (error) {
    next(error);
  }
};

/**
 * Check user exists
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const checkUserExistsByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    if (!obj.email) {
      return next(new ERROR.BadRequestError('Required email field'));
    }
    //authenticate user
    const userExistsResponse = await authService.findUserExistsByEmail(obj);
    //send response
    const authUserResponse: ApiResponse<{ userExists: boolean }> = new ApiResponse<{ userExists: boolean }>();
    authUserResponse.message = 'Success!';
    authUserResponse.data = { userExists: userExistsResponse };
    res.json(authUserResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Send Email OTP for modified admin password
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const sendEmailOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.body.email;
    //send Email OTP
    await authService.sendEmailOTP(email);
    //send response
    const apiRespose: ApiResponse<{}> = new ApiResponse<{}>();
    apiRespose.message = 'Success! OTP Sent to email.';
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Verify Email OTP
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    //authenticate student
    const isVerified: boolean = await authService.verifyOtp(email, otp);

    //send response
    const apiRespose: ApiResponse<{ isVerified: boolean }> = new ApiResponse<{ isVerified: boolean }>();
    apiRespose.message = 'Email verification success!';
    apiRespose.data = { isVerified };
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Login
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const signUpUserByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    let fcmToken: string = '';
    if (req.headers['fcm-token']) fcmToken = req.headers['fcm-token'] as string;
    if (!obj.email) {
      return next(new ERROR.BadRequestError('Required email field'));
    }
    //authenticate user
    const userData: IUser = await authService.createUserEmail(obj);
    //generate token
    const tokenData = await tokenService.generateAuthTokens(userData, 'user');
    //save fcm token
    if (fcmToken) fcmTokenService.saveFCMToken(userData._id.toString(), fcmToken);
    //send response
    const apiRespose: ApiResponse<{ user: IUser; tokens: any }> = new ApiResponse<{ user: IUser; tokens: any }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { user: userData, tokens: tokenData };
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Login
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const loginUserByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    let fcmToken: string = '';
    if (req.headers['fcm-token']) fcmToken = req.headers['fcm-token'] as string;
    if (!obj.email) {
      return next(new ERROR.BadRequestError('Required email field'));
    }
    //authenticate user
    const userData: IUser = await authService.emailLogin(obj);
    //generate token
    const tokenData = await tokenService.generateAuthTokens(userData, 'user');
    //save fcm token
    if (fcmToken) fcmTokenService.saveFCMToken(userData._id.toString(), fcmToken);
    //send response
    const apiRespose: ApiResponse<{ user: IUser; tokens: any }> = new ApiResponse<{ user: IUser; tokens: any }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { user: userData, tokens: tokenData };
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

export default {
  authenticateUser,
  logOutUser,
  refreshTokens,
  checkUserExists,
  checkUserNameExists,
  checkFaceRecognition,
  checkUserExistsByEmail,
  sendEmailOTP,
  verifyOTP,
  signUpUserByEmail,
  loginUserByEmail,
};
