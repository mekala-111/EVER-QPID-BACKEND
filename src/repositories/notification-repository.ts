import NotificationEntity from '../entities/notification-entity';
import NOTIFICATION from '../models/notification/notification';
import { INotification } from './../models/notification/notification-model';
import ERROR from '../middlewares/web_server/http-error';
import { Types } from 'mongoose';
import SUBSCRIPTION_PURCHASE_HISTORY from '../models/subscription-purchase-history/subscription-purchase-history';
import { notificationService } from '../services';

/*----------------------------------------------------------------------------------*/
/**
 * Create a new notification
 * @param {NotificationEntity} notificationEntity
 * @returns {Promise<INotification>}
 */
const create = async (notificationEntity: NotificationEntity): Promise<INotification> => {
  const notificationData = await new NOTIFICATION(notificationEntity).save();
  return notificationData;
};
/*----------------------------------------------------------------------------------*/
/**
 * Get notifications for a user by userId
 * @param { string } userId
 * @returns {Promise<INotification[]>}
 */
const getNotificationsByUserId = async (searchConditions: Record<string, any>, skip: number, limit: number): Promise<INotification[]> => {
  const notifications = await NOTIFICATION.find(searchConditions)
    .sort({ sentOn: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name profileImageUrl')
    .exec();

  return notifications;
};
/*----------------------------------------------------------------------------------*/
/**
 * Get notification by notification ID
 * @param {string} notificationId - The ID of the notification.
 * @returns {Promise<INotification | null>}
 */
const getNotificationById = async (notificationId: string): Promise<INotification | null> => {
  const notification = await NOTIFICATION.findById(notificationId).exec();
  return notification;
};

/*----------------------------------------------------------------------------------*/
/**
 * Update a notification
 * @param {String} notificationId
 * @returns {Promise<INotification>}
 */
const updateViewStatus = async (notificationId: string): Promise<INotification> => {
  const notificationData = await NOTIFICATION.findOneAndUpdate({ _id: notificationId }, { $set: { viewStatus: true } }, { new: true });
  if (!notificationData) {
    throw new ERROR.BadRequestError('notification not found');
  }
  return notificationData;
};
/*----------------------------------------------------------------------------------*/
/**
 * Update a all notification
 * @param {String} notificationId
 * @returns {Promise<INotification>}
 */
const updateViewStatusAll = async (userId: string): Promise<INotification[]> => {
  const notificationData = await NOTIFICATION.updateMany({ recipient: new Types.ObjectId(userId) }, { $set: { viewStatus: true } }, { new: true });

  if (notificationData.modifiedCount === 0) {
    throw new ERROR.BadRequestError('No notifications found to update');
  }

  const updatedNotifications = await NOTIFICATION.find({ recipient: new Types.ObjectId(userId) });
  return updatedNotifications;
};
/*----------------------------------------------------------------------------------*/
/**
 * Get  notification count
 * @returns {Promise<number>}
 */
const getNotificationCount = async (searchConditions: Record<string, any>): Promise<number> => {
  const totalCount = await NOTIFICATION.countDocuments(searchConditions).exec();
  return totalCount;
};

/**
 * Remove a specific notification
 * @param {any} searchConditions - Conditions to find the notification (e.g., notificationId and userId).
 * @returns {Promise<void>}
 */
const removeNotification = async (searchConditions: any): Promise<void> => {
  const notificationData = await NOTIFICATION.findOneAndDelete(searchConditions);

  if (!notificationData) {
    throw new Error('Notification not found or you do not have permission to delete it');
  }
};

/**
 * Remove all notifications for a specific user
 * @param {any} searchConditions - Conditions to find notifications (e.g., userId).
 * @returns {Promise<void>}
 */
const removeAllNotifications = async (searchConditions: any): Promise<void> => {
  const result = await NOTIFICATION.deleteMany(searchConditions);

  if (result.deletedCount === 0) {
    throw new Error('No notifications found to delete or you do not have permission to delete them');
  }
};

const sendLowBalanceNotifications = async () => {
  const whereData = {
    documentStatus: true,
    coinBalance: { $lt: 10 },
  };

  const expiringSoonSubscriptions = await SUBSCRIPTION_PURCHASE_HISTORY.find(whereData).exec();
  const userIds = expiringSoonSubscriptions.map((sub) => sub.userId.toString());

  for (const userId of userIds) {
    await notificationService.createNotification(
      userId,
      'low_balance',
      'Low Coin Balance Warning',
      'Your coin balance is running low. Recharge now to continue enjoying premium features without interruption.',
      'myProfile',
      null,
    );
  }

  return userIds.length;
};

export default {
  create,
  getNotificationsByUserId,
  getNotificationById,
  updateViewStatus,
  getNotificationCount,
  removeAllNotifications,
  removeNotification,
  updateViewStatusAll,
  sendLowBalanceNotifications,
};
