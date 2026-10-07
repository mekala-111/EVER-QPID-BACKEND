import { Types } from 'mongoose';
import NotificationEntity from '../entities/notification-entity';
import { INotification } from '../models/notification/notification-model';
import notificationRepository from '../repositories/notification-repository';
/*-------------------------------------------------------------------------------------*/
/**
 * Create notification
 * @param {string} recipient - The ID of the recipient.
 * @param {string} notificationType
 * @param {string} title
 * @param {string} description
 * @param {string} onTapNavigate
 * @param {string | null} connectedProfileId
 * @param {string | null} connectedPostId
 * @param {string | null} connectedCommentId
 * @param {string | null} connectedReplyId
 * @returns {Promise<INotification>}
 */
const createNotification = async (
  recipient: string,
  notificationType: string,
  title: string,
  description: string,
  onTapNavigate: string,
  sender: string | null,
): Promise<INotification> => {
  const notificationEntity: NotificationEntity = new NotificationEntity(
    new Types.ObjectId(),
    new Types.ObjectId(recipient),
    notificationType,
    title,
    description,
    onTapNavigate,
    new Date(),
    sender ? new Types.ObjectId(sender) : null,
    true,
    false,
  );

  const createdNotification = await notificationRepository.create(notificationEntity);
  return createdNotification;
};
/*-------------------------------------------------------------------------------------*/

/**
 * Get notifications for a user by userId
 * @param { string } userId
 * @returns {Promise<INotification[]>}
 */
const getNotificationsByUserId = async (
  userId: string,
  pageNumber: number,
  pageSize: number,
  notificationType?: string,
): Promise<{ notifications: INotification[]; totalCount: number; hasNext: boolean }> => {
  const skip = (pageNumber - 1) * pageSize;
  let hasNext = false;

  const searchConditions: Record<string, any> = {
    recipient: new Types.ObjectId(userId),
    documentStatus: true,
  };
  if (notificationType) {
    searchConditions['notificationType'] = notificationType;
  }
  const [notifications, totalCount] = await Promise.all([
    notificationRepository.getNotificationsByUserId(searchConditions, skip, pageSize),
    notificationRepository.getNotificationCount(searchConditions),
  ]);
  if (totalCount > skip + pageSize) hasNext = true;
  return { notifications, totalCount, hasNext };
};

/*----------------------------------------------------------------------------------*/
/**
 * Update notification view status
 * @param {String} notificationId
 * @returns {Promise<INotification>}
 */
const updateNotificationViewStatus = async (notificationId: string): Promise<INotification> => {
  const updatedNotification = await notificationRepository.updateViewStatus(notificationId);
  return updatedNotification;
};

/*----------------------------------------------------------------------------------*/
/**
 * Update notification view status
 * @param {String} notificationId
 * @returns {Promise<INotification>}
 */
const updateAllNotificationsViewStatus = async (userId: string): Promise<INotification[]> => {
  const updatedNotification = await notificationRepository.updateViewStatusAll(userId);
  return updatedNotification;
};
/*----------------------------------------------------------------------------------*/

/**
 * Get unRead  notification count
 * @param { string } userId
 * @returns {totalCount:number}
 */
const getNotificationsCount = async (userId: string): Promise<number> => {
  const searchConditions: Record<string, any> = {
    recipient: new Types.ObjectId(userId),
    documentStatus: true,
    viewStatus: false,
  };

  const totalCount = await notificationRepository.getNotificationCount(searchConditions);
  return totalCount;
};

/*----------------------------------------------------------------------------------*/
/**
 * Delete a specific notification
 * @param {string} notificationId - The ID of the notification to delete.
 * @param {string} userId - The ID of the user who owns the notification.
 * @returns {Promise<void>}
 */
const deleteNotification = async (notificationId: string, userId: string): Promise<void> => {
  const searchConditions: any = {
    _id: new Types.ObjectId(notificationId),
    recipient: new Types.ObjectId(userId),
  };
  console.log(searchConditions);
  await notificationRepository.removeNotification(searchConditions);
};

/*----------------------------------------------------------------------------------*/
/**
 * Delete all notifications for a specific user
 * @param {string} userId - The ID of the user whose notifications will be deleted.
 * @returns {Promise<void>}
 */
const deleteAllNotifications = async (userId: string): Promise<void> => {
  const searchConditions: any = {
    recipient: new Types.ObjectId(userId),
  };

  await notificationRepository.removeAllNotifications(searchConditions);
};

export default {
  createNotification,
  getNotificationsByUserId,
  updateNotificationViewStatus,
  getNotificationsCount,
  deleteNotification,
  deleteAllNotifications,
  updateAllNotificationsViewStatus,
};
