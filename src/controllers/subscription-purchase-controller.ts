import { Request, Response, NextFunction } from 'express';
import { subscriptionPurchaseService } from '../services';
import ApiResponse from '../utils/api-response';
import { ISubscriptionPurchaseHistory } from '../models/subscription-purchase-history/subscription-purchase-history-model';
import { validateUserAuthorization } from '../utils/validators';
import { AuthRequest } from '../middlewares/auth/verify-admin';

/**
 * Create a new coin order
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, subscriptionId } = req.body;
    const newsubscriptionOrder = await subscriptionPurchaseService.createPayment(userId, subscriptionId);
    const apiResponse: ApiResponse<{ orderDetails: ISubscriptionPurchaseHistory }> = new ApiResponse<{
      orderDetails: ISubscriptionPurchaseHistory;
    }>();
    apiResponse.message = 'subscription order payment created successfully!';
    apiResponse.data = { orderDetails: newsubscriptionOrder };
    apiResponse.statusCode = 201;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * verifyPayment
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, orderId, paymentId } = req.body;
    const razorpay_signature = req.headers['x-razorpay-signature'] as string;

    const newsubscriptionOrder: any = await subscriptionPurchaseService.verifyPayment(userId, orderId, paymentId, razorpay_signature);
    const apiResponse: ApiResponse<{ purchaseHistory: ISubscriptionPurchaseHistory | null }> = new ApiResponse<{
      purchaseHistory: ISubscriptionPurchaseHistory | null;
    }>();
    apiResponse.message = 'Payment verified successfully!';
    apiResponse.data = { purchaseHistory: newsubscriptionOrder };
    apiResponse.statusCode = 201;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user order histories (user only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getUserOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const pageNumber: string = req.query.pageNumber ? (req.query.pageNumber as string) : '1';
    const pageSize: string = req.query.pageSize ? (req.query.pageSize as string) : '10';
    const searchTag: string = req.query.searchTag ? (req.query.searchTag as string) : '';

    const { orderHistory, hasNext, totalCount } = await subscriptionPurchaseService.getUserOrders(userId, {
      pageNumber: parseInt(pageNumber, 10),
      pageSize: parseInt(pageSize, 10),
      searchTag,
    });

    const apiResponse: ApiResponse<{ orderHistory: ISubscriptionPurchaseHistory[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'Success!';
    apiResponse.data = { orderHistory, hasNext, totalCount };
    apiResponse.statusCode = 200;
    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all order histories (Admin only) with optional filters
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllCoinOrdersAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId } = req.body;
    const pageNumber: string = req.query.pageNumber ? (req.query.pageNumber as string) : '1';
    const pageSize: string = req.query.pageSize ? (req.query.pageSize as string) : '10';
    const searchTag: string = req.query.searchTag ? (req.query.searchTag as string) : '';
    const from: string = req.query.from ? (req.query.from as string) : '';
    const to: string = req.query.to ? (req.query.to as string) : '';
    const userId: string = req.query.userId ? (req.query.userId as string) : '';

    const parsedStartDate = from ? new Date(from) : undefined;
    const parsedEndDate = to ? new Date(to) : undefined;

    const { orderHistory, hasNext, totalCount } = await subscriptionPurchaseService.getAllOrdersAdmin({
      adminId,
      pageNumber: parseInt(pageNumber, 10),
      pageSize: parseInt(pageSize, 10),
      searchTag,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      userId,
    });

    const apiResponse: ApiResponse<{ orderHistory: ISubscriptionPurchaseHistory[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'Success!';
    apiResponse.data = { orderHistory, hasNext, totalCount };
    apiResponse.statusCode = 200;
    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Calculate total revenue (Admin only) with optional date filters
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to } = req.query;

    const totalRevenue = await subscriptionPurchaseService.calculateTotalRevenue({
      startDate: from as string | undefined,
      endDate: to as string | undefined,
    });

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Total revenue calculated successfully!';
    apiResponse.data = { totalRevenue };
    apiResponse.statusCode = 200;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user order histories (user only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getUserOrdersAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId } = req.body;
    validateUserAuthorization(adminId);
    const { userId } = req.params;
    const pageNumber: string = req.query.pageNumber ? (req.query.pageNumber as string) : '1';
    const pageSize: string = req.query.pageSize ? (req.query.pageSize as string) : '10';
    const searchTag: string = req.query.searchTag ? (req.query.searchTag as string) : '';

    const { orderHistory, hasNext, totalCount } = await subscriptionPurchaseService.getUserOrders(userId, {
      pageNumber: parseInt(pageNumber, 10),
      pageSize: parseInt(pageSize, 10),
      searchTag,
    });

    const apiResponse: ApiResponse<{ orderHistory: ISubscriptionPurchaseHistory[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'Success!';
    apiResponse.data = { orderHistory, hasNext, totalCount };
    apiResponse.statusCode = 200;
    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getUserTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;

    if (!adminId) throw new Error('Admin not authenticated');

    const transactions = await subscriptionPurchaseService.getUserTransactions(userId);

    const apiResponse = new ApiResponse();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'User transactions retrieved successfully';
    apiResponse.data = transactions;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

export default {
  createPayment,
  verifyPayment,
  getUserOrders,
  getAllCoinOrdersAdmin,
  getRevenue,
  getUserOrdersAdmin,
  getUserTransactions,
};
