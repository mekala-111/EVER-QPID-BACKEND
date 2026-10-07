import ApiResponse from '../utils/api-response';
import ERROR from '../middlewares/web_server/http-error';
import { RtmTokenBuilder, RtmRole } from 'agora-access-token';
import { Request, Response } from 'express';

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// RTM Token for text messaging
const generateRTMToken = (req: Request, resp: Response) => {
  resp.header('Access-Control-Allow-Origin', '*');
  const uid = req.params.uid;
  if (!uid || uid.trim() === '') {
    throw new ERROR.BadRequestError('Error: UID is required');
  }

  const role = RtmRole.Rtm_User;
  const defaultExpireTime = 3600;
  const expireTime = req.query.expiry ? parseInt(req.query.expiry as string, 10) : defaultExpireTime;
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  try {
    const token = RtmTokenBuilder.buildToken(APP_ID as string, APP_CERTIFICATE as string, uid, role, privilegeExpireTime);
    const apiResponse = new ApiResponse<{ rtmToken: string }>();
    apiResponse.message = 'RTM Token generated successfully';
    apiResponse.data = { rtmToken: token };
    apiResponse.statusCode = 200;
    resp.json(apiResponse);
  } catch (error) {
    throw new ERROR.BadRequestError('Failed to generate RTM Token');
  }
};

export default { generateRTMToken };
