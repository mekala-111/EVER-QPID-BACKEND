import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import { signedUrlService } from '../services';
/**
 * Create signed url
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getSignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;
    const signedUrl = await signedUrlService.generateSignedUrl(obj);
    const apiRespose: ApiResponse<{ signedUrl: string }> = new ApiResponse<{ signedUrl: string }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { signedUrl: signedUrl };
    apiRespose.statusCode = 201;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

const getDownloadSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: 'Key is required',
      });
    }

    const signedUrl = await signedUrlService.generateGetSignedUrl(key);

    const apiResponse = new ApiResponse<{ signedUrl: string }>();
    apiResponse.message = 'Success!';
    apiResponse.statusCode = 200;
    apiResponse.data = { signedUrl };

    res.json(apiResponse);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

export default {
  getSignedUrl,
  getDownloadSignedUrl,
};
