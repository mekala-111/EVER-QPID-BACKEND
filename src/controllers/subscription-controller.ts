import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import { subscriptionService } from '../services';
import { ISubscriptionPlan } from '../models/Subscription/Subscription-model';
import { parsePagination } from '../utils/pagination';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import ERROR from '../middlewares/web_server/http-error';

/**
 * Get all subscriptions (User)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllSubscriptionsForUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { pageNumber, pageSize } = parsePagination(req);

    const { subscriptions, totalCount, hasNext } = await subscriptionService.getAllSubscriptionPlansUser(userId, pageNumber, pageSize);

    const apiResponse = new ApiResponse<{ subscriptions: ISubscriptionPlan[]; hasNext: boolean; totalCount: number }>();
    apiResponse.message = 'Subscriptions retrieved successfully!';
    apiResponse.data = { subscriptions, hasNext, totalCount };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all subscriptions (Admin)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { pageNumber, pageSize } = parsePagination(req);

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    const { subscriptions, totalCount, hasNext } = await subscriptionService.getAllSubscriptions({
      pageNumber,
      pageSize,
    });

    const apiResponse = new ApiResponse<{ subscriptions: ISubscriptionPlan[]; hasNext: boolean; totalCount: number }>();
    apiResponse.message = 'Subscriptions retrieved successfully!';
    apiResponse.data = { subscriptions, hasNext, totalCount };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Create a new subscription (Admin only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId, imageUrl, ...obj } = req.body;

    const newSubscription = await subscriptionService.createSubscription(adminId, { ...obj, imageUrl });

    const apiResponse = new ApiResponse<ISubscriptionPlan>();
    apiResponse.message = 'Subscription created successfully!';
    apiResponse.data = newSubscription;
    apiResponse.statusCode = 201;

    res.status(201).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Update a subscription by ID (Admin only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const updateSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subscriptionId } = req.params;

    const { adminId, ...obj } = req.body;
    const updatedSubscription = await subscriptionService.updateSubscription(subscriptionId, adminId, obj);

    const apiResponse = new ApiResponse<ISubscriptionPlan | null>();
    apiResponse.message = 'Subscription updated successfully!';
    apiResponse.data = updatedSubscription;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a subscription by ID (Admin only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const deleteSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    await subscriptionService.deleteSubscription(subscriptionId);

    const apiResponse = new ApiResponse<null>();
    apiResponse.message = 'Subscription deleted successfully!';
    apiResponse.statusCode = 204;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};
/**
 * Get a subscription by ID (Admin only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getSubscriptionDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await subscriptionService.getSubscriptionDetails(subscriptionId);

    const apiResponse = new ApiResponse<ISubscriptionPlan>();
    apiResponse.message = 'Subscription details fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = subscription;

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const toggleSubscriptionStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { subscriptionId } = req.params;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    if (!subscriptionId) {
      throw new ERROR.BadRequestError('Subscription ID is required');
    }

    const updatedSubscription = await subscriptionService.toggleSubscriptionStatus(subscriptionId);

    const apiResponse = new ApiResponse<{ subscription: ISubscriptionPlan }>();
    apiResponse.message = `Subscription ${updatedSubscription.isPlanActive ? 'activated' : 'deactivated'} successfully!`;
    apiResponse.data = { subscription: updatedSubscription };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

export default {
  getAllSubscriptionsForUsers,
  getAllSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionDetails,
  toggleSubscriptionStatus,
};
