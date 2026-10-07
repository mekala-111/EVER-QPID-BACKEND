import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import { blockService } from '../services';
import { IBlock } from '../models/block/block-model';
import ERROR from '../middlewares/web_server/http-error';

/**
 * Block a User
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, blockedAccountId, selectedReasons } = req.body;

    // Call the service to block the user
    const blockResult: IBlock | null = await blockService.blockUser(userId, blockedAccountId, selectedReasons);

    const apiResponse = new ApiResponse<{ blockResult: IBlock | null }>();
    apiResponse.message = 'User blocked successfully!';
    apiResponse.data = { blockResult };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Unblock a User
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { blockedUserId } = req.params;
    // Call the service to unblock the user
    const unblockResult: boolean = await blockService.unblockUser(userId, blockedUserId);

    const apiResponse = new ApiResponse<{ unblockStatus: boolean }>();
    apiResponse.message = 'User unblocked successfully!';
    apiResponse.data = { unblockStatus: unblockResult };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all Blocked Users
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllBlockedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const searchTag = (req.query.searchTag as string) || '';

    const { blockedUsers, hasNext, totalCount } = await blockService.getAllBlockedUsers(userId, {
      pageNumber,
      pageSize,
      searchTag,
    });

    const apiResponse = new ApiResponse<{ blockedUsers: IBlock[]; hasNext: boolean; totalCount: number }>();
    apiResponse.message = 'Blocked users fetched successfully!';
    apiResponse.data = { blockedUsers, hasNext, totalCount };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Block a User by Admin
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const blockUserAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId, blockedAccountId, selectedReasons } = req.body;
    // Call the service to block the user
    const blockResult: any = await blockService.blockUserAdmin(adminId, blockedAccountId, selectedReasons);

    const apiResponse = new ApiResponse<{ blockResult: IBlock | null }>();
    apiResponse.message = 'User blocked successfully by admin!';
    apiResponse.data = { blockResult };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Unblock a User by Admin
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const unblockUserAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId } = req.body;
    const { blockedUserId } = req.params;
    if (!adminId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    // Call the service to unblock the user
    const unblockResult: boolean = await blockService.unblockUserAdmin(adminId, blockedUserId);

    const apiResponse = new ApiResponse<{ unblockStatus: boolean }>();
    apiResponse.message = 'User unblocked successfully by admin!';
    apiResponse.data = { unblockStatus: unblockResult };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all Blocked admin
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllBlockedAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId } = req.body;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const searchTag = (req.query.searchTag as string) || '';

    const { blockedUsers, hasNext, totalCount } = await blockService.getAllBlockedAdmin(adminId, {
      pageNumber,
      pageSize,
      searchTag,
    });

    const apiResponse = new ApiResponse<{ blockedUsers: IBlock[]; hasNext: boolean; totalCount: number }>();
    apiResponse.message = 'Blocked users fetched successfully!';
    apiResponse.data = { blockedUsers, hasNext, totalCount };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

export default { blockUser, unblockUser, getAllBlockedUsers, blockUserAdmin, unblockUserAdmin, getAllBlockedAdmin };
