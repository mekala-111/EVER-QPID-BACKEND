import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import { IPushNotification } from '../models/push-notification/push-notification-model';
import { pushNotificationService } from '../services';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import ERROR from '../middlewares/web_server/http-error';

/**
 * Create a notification
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const addNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;
    //const adminId = obj?.adminId;
    const adminId = req.user?.id;
    obj.createdUser = adminId;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    const notificationData: IPushNotification | null = await pushNotificationService.addNotification(adminId, obj);
    const apiResponse: ApiResponse<{ notificationData: IPushNotification | null }> = new ApiResponse<{
      notificationData: IPushNotification | null;
    }>();
    apiResponse.message = 'Notification Created Successfully';
    apiResponse.data = { notificationData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a notification
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const updateNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;
    const adminId = obj?.adminId;
    const id = req.params.notificationId;
    obj.updatedUser = adminId;
    const notificationData: IPushNotification | null = await pushNotificationService.updateNotification(adminId, id, obj);
    const apiResponse: ApiResponse<{ notificationData: IPushNotification | null }> = new ApiResponse<{
      notificationData: IPushNotification | null;
    }>();
    apiResponse.message = 'Notification Updated Successfully';
    apiResponse.data = { notificationData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const obj: any = req.body;
    const userId = obj?.adminId;
    const notificationData: IPushNotification | null = await pushNotificationService.deleteNotification(userId, notificationId); // Pass only ID to service
    const apiResponse: ApiResponse<{ notificationData: IPushNotification | null }> = new ApiResponse<{
      notificationData: IPushNotification | null;
    }>();
    apiResponse.message = 'Notification Deleted Successfully';
    apiResponse.data = { notificationData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a list of notifications
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const pageNumber: string = req.query.pageNumber ? (req.query.pageNumber as string) : '';
    const pageSize: string = req.query.pageSize ? (req.query.pageSize as string) : '';
    const searchTag: string = req.query.searchTag ? (req.query.searchTag as string) : '';
    const fromDate: string = req.query.fromDate ? (req.query.fromDate as string) : '';
    const toDate: string = req.query.toDate ? (req.query.toDate as string) : '';
    const notificationType: string = req.query.notificationType ? (req.query.notificationType as string) : '';

    const notifications: { notifications: IPushNotification[]; count: number; hasNext: boolean } = await pushNotificationService.getNotifications(
      adminId,
      pageNumber,
      pageSize,
      searchTag,
      fromDate,
      toDate,
      notificationType,
    );
    const apiResponse: ApiResponse<{ notifications: IPushNotification[]; count: number; hasNext: boolean }> = new ApiResponse<{
      notifications: IPushNotification[];
      count: number;
      hasNext: boolean;
    }>();
    apiResponse.message = 'Notifications fetched successfully';
    apiResponse.data = notifications;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const pauseNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { notificationId } = req.params;
    const { paused } = req.body;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    if (!notificationId) {
      throw new ERROR.BadRequestError('Notification ID is required');
    }

    if (paused === undefined) {
      throw new ERROR.BadRequestError('Paused status is required');
    }

    const updatedNotification = await pushNotificationService.pauseNotification(notificationId, paused);

    const apiResponse = new ApiResponse<{ notification: IPushNotification }>();
    apiResponse.message = `Notification ${paused ? 'paused' : 'resumed'} successfully!`;
    apiResponse.data = { notification: updatedNotification };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

export default {
  addNotification,
  updateNotification,
  deleteNotification,
  getNotifications,
  pauseNotification,
};
