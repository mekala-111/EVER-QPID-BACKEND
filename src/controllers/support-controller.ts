import { Request, Response, NextFunction } from 'express';
import supportService from '../services/support-service';
import ApiResponse from '../utils/api-response';
import { Types } from 'mongoose';
import { ISupport } from '../models/support/support-model';

const sentSupport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const supportData: ISupport | null = await supportService.sendSupport(data);

    const apiResponse: ApiResponse<{ supportData: ISupport | null }> = new ApiResponse<{
      supportData: ISupport | null;
    }>();

    apiResponse.message = 'Support Ticket Created Successfully';
    apiResponse.data = { supportData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getSupports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userIdStr = req.query.loginUserId as string;
    const userId = new Types.ObjectId(userIdStr);

    const support: ISupport[] = await supportService.getSupports(userId);
    const apiResponse: ApiResponse<{ support: ISupport[] }> = new ApiResponse<{ support: ISupport[] }>();
    apiResponse.message = 'Support fetched successfully';
    apiResponse.data = { support };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

export default {
  sentSupport,
  getSupports,
};
