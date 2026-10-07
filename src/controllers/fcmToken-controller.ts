import { Response } from 'express';
import fcmTokenService from '../services/fcm-token-service';
import ApiResponse from '../utils/api-response';
import { AuthRequest } from '../middlewares/auth/verify-admin';

const registerFcmToken = async (req: AuthRequest, res: Response) => {
  const apiResponse = new ApiResponse();
  try {
    const userId = req.body.userId;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      apiResponse.message = 'FCM token is required';
      apiResponse.statusCode = 400;
      return res.status(400).json(apiResponse);
    }

    const updatedTokens = await fcmTokenService.registerToken(userId, fcmToken);

    apiResponse.message = 'FCM token registered successfully';
    apiResponse.statusCode = 200;
    apiResponse.data = updatedTokens;
    return res.status(200).json(apiResponse);
  } catch (err: any) {
    apiResponse.message = err.message;
    apiResponse.statusCode = 500;
    return res.status(500).json(apiResponse);
  }
};

const removeFcmToken = async (req: AuthRequest, res: Response) => {
  const apiResponse = new ApiResponse();
  try {
    const userId = req.body.userId;
    const { token } = req.body;

    if (!token) {
      apiResponse.message = 'FCM token is required';
      apiResponse.statusCode = 400;
      return res.status(400).json(apiResponse);
    }

    const updatedTokens = await fcmTokenService.removeToken(userId, token);

    apiResponse.message = 'FCM token removed successfully';
    apiResponse.statusCode = 200;
    apiResponse.data = updatedTokens;
    return res.status(200).json(apiResponse);
  } catch (err: any) {
    apiResponse.message = err.message;
    apiResponse.statusCode = 500;
    return res.status(500).json(apiResponse);
  }
};

export default { registerFcmToken, removeFcmToken };
