import { Request, Response, NextFunction } from 'express';

import ApiResponse from '../utils/api-response';
import { interestService } from '../services';
import { IIntrest } from '../models/interests/interest-model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}
/**
 * Get all interests for users with pagination
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getInterests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pageNumber: number = parseInt(req.query.pageNumber as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 10;

    const { interests, totalCount, hasNext } = await interestService.getInterests({ pageNumber, pageSize });

    const apiResponse = new ApiResponse<{ interests: IIntrest[]; totalCount: number; hasNext: boolean }>();
    apiResponse.message = 'Interests retrieved successfully!';
    apiResponse.data = { interests, totalCount, hasNext };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Add a new user interest
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const createUserInterest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { interest, adminId } = req.body;

    const newInterest = await interestService.createUserInterest(interest, adminId);

    const apiResponse = new ApiResponse<{ interest: IIntrest }>();
    apiResponse.message = 'Interest added successfully!';
    apiResponse.data = { interest: newInterest };
    apiResponse.statusCode = 201;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const editUserInterest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { interest } = req.body;
    const { interestId } = req.params;

    const adminId = req.user!.id;

    const updatedInterest = await interestService.editUserInterest(interestId, interest, adminId);

    const apiResponse = new ApiResponse<{ interest: IIntrest }>();
    apiResponse.message = 'Interest updated successfully!';
    apiResponse.data = { interest: updatedInterest };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const deleteUserInterest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { interestId } = req.params;
    const adminId = req.user!.id;

    const deletedInterest = await interestService.deleteUserInterest(interestId, adminId);

    const apiResponse = new ApiResponse<{ interest: IIntrest }>();
    apiResponse.message = 'Interest deleted successfully';
    apiResponse.data = { interest: deletedInterest };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

export default { getInterests, createUserInterest, editUserInterest, deleteUserInterest };
