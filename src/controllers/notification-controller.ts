import { Request, Response, NextFunction } from 'express';
import { INotification } from '../models/notification/notification-model';
import ApiResponse from '../utils/api-response';
import ERROR from '../middlewares/web_server/http-error';
import { notificationService } from '../services';

/*-------------------------------------------------------------------------------------*/
/**
 * Get all notifications for a user
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    const pageNumber: number = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : 1;
    const pageSize: number = req.query.pageSize ? parseInt(req.query.pageSize as string) : 12;
    const notificationType: string | undefined = req.query.notificationType as string | undefined;

    const { notifications, totalCount, hasNext } = await notificationService.getNotificationsByUserId(userId, pageNumber, pageSize, notificationType);

    const apiResponse: ApiResponse<{ notifications: INotification[]; totalCount: number; hasNext: boolean }> = new ApiResponse<{
      notifications: INotification[];
      totalCount: number;
      hasNext: boolean;
    }>();
    apiResponse.message = 'Notifications fetched successfully!';
    apiResponse.data = { notifications, totalCount, hasNext };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/*-------------------------------------------------------------------------------------*/
/**
 * Update a notification view status
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }
    if (!notificationId) {
      return next(new ERROR.BadRequestError('Notification ID is required.'));
    }

    const updatedNotification = await notificationService.updateNotificationViewStatus(notificationId);

    if (!updatedNotification) {
      return next(new ERROR.BadRequestError('Notification not found.'));
    }

    const apiResponse: ApiResponse<{ notification: INotification }> = new ApiResponse<{ notification: INotification }>();
    apiResponse.message = 'Notification view status updated successfully!';
    apiResponse.data = { notification: updatedNotification };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/*-------------------------------------------------------------------------------------*/

/*-------------------------------------------------------------------------------------*/
/**
 * Update a notification view status
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    const updatedNotifications = await notificationService.updateAllNotificationsViewStatus(userId);

    if (!updatedNotifications || updatedNotifications.length === 0) {
      return next(new ERROR.BadRequestError('No notifications found to update.'));
    }

    const apiResponse: ApiResponse<{ notification: INotification[] | null }> = new ApiResponse<{ notification: INotification[] | null }>();
    apiResponse.message = 'Notification view status updated successfully!';
    apiResponse.data = { notification: null };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/*-------------------------------------------------------------------------------------*/
/**
 * Get all notifications count for a user
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getNotificationCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    const totalCount = await notificationService.getNotificationsCount(userId);

    const apiResponse: ApiResponse<{ totalCount: number }> = new ApiResponse<{
      totalCount: number;
    }>();
    apiResponse.message = 'Notifications count feteched successfully!';
    apiResponse.data = { totalCount };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/*-------------------------------------------------------------------------------------*/

/**
 * Delete a specific notification
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body; // Authorization check with userId
    const { notificationId } = req.params; // Notification ID passed as URL parameter

    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    await notificationService.deleteNotification(notificationId, userId);

    const apiResponse: ApiResponse<{ notification: null }> = new ApiResponse<{ notification: null }>();
    apiResponse.message = 'Notification deleted successfully';
    apiResponse.data = { notification: null };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const deleteAllNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    await notificationService.deleteAllNotifications(userId);

    const apiResponse: ApiResponse<{ notifications: null }> = new ApiResponse<{ notifications: null }>();
    apiResponse.message = 'All notifications deleted successfully';
    apiResponse.data = { notifications: null };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

export default { listNotifications, markAsRead, getNotificationCount, deleteAllNotifications, deleteNotification, markAllAsRead };
