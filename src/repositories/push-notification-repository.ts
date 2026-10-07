import { IPushNotification } from '../models/push-notification/push-notification-model';
import PushNotificationsEntity from '../entities/push-notification-entity';
import PUSH_NOTIFICATIONS from '../models/push-notification/push-notification';

/**
 * Add new notification to the database
 * @param {PushNotificationsEntity} notificationEntity
 * @returns {Promise<IPushNotification>}
 */
const createNotification = async (notificationEntity: PushNotificationsEntity): Promise<IPushNotification> => {
  const notification = await new PUSH_NOTIFICATIONS(notificationEntity).save();
  return notification;
};

/**
 * Soft delete a notification
 * @param {string} id
 * @param {object} update
 * @returns {Promise<INotification | null>}
 */
const deleteNotification = async (id: string, update: object): Promise<IPushNotification | null> => {
  const notification = await PUSH_NOTIFICATIONS.findByIdAndUpdate(id, update, { new: true });
  return notification;
};

/**
 * Update a notification
 * @param {string} id
 * @param {object} update
 * @returns {Promise<INotification | null>}
 */
const updateNotification = async (id: string, update: object): Promise<IPushNotification | null> => {
  const notification = await PUSH_NOTIFICATIONS.findByIdAndUpdate(id, update, { new: true });
  return notification;
};

/**
 * Get all notifications
 */
const getNotifications = async (
  pageNumber: string,
  pageSize: string,
  searchTag: string,
  fromDate: string,
  toDate: string,
  notificationType: string,
): Promise<{ notifications: IPushNotification[]; count: number; hasNext: boolean }> => {
  let skip = 0;
  let limit = 12;
  let hasNext = false;

  if (pageSize) limit = parseInt(pageSize);
  if (pageNumber) skip = (parseInt(pageNumber) - 1) * limit;

  const match: any = {
    documentStatus: true,
  };

  if (notificationType) {
    match.notificationType = notificationType;
  }

  if (searchTag) {
    const searchOption = {
      $or: [{ title: { $regex: searchTag, $options: 'i' } }],
    };
    Object.assign(match, searchOption);
  }

  if (fromDate && toDate) {
    const dateFrom = new Date(fromDate);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(toDate);
    dateTo.setHours(23, 59, 59, 999);

    match.createdAt = {
      $gte: dateFrom,
      $lte: dateTo,
    };
  } else if (fromDate) {
    const dateFrom = new Date(fromDate);
    dateFrom.setHours(0, 0, 0, 0);

    match.createdAt = {
      $gte: dateFrom,
    };
  } else if (toDate) {
    const dateTo = new Date(toDate);
    dateTo.setHours(23, 59, 59, 999);

    match.createdAt = {
      $lte: dateTo,
    };
  }

  const count = await PUSH_NOTIFICATIONS.countDocuments(match);

  if (!pageSize && count > 0) limit = count;

  const notifications = await PUSH_NOTIFICATIONS.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit);

  if (count > skip + limit) {
    hasNext = true;
  }
  return { notifications, count, hasNext };
};

const getAllActiveNotifications = async () => {
  const match = {
    documentStatus: true,
    paused: false,
    toDate: {
      $gte: new Date(),
    },
  };

  return await PUSH_NOTIFICATIONS.find(match);
};

const pauseNotification = async (notificationId: string, paused: boolean): Promise<IPushNotification> => {
  const notification = await PUSH_NOTIFICATIONS.findById(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.paused = paused;
  notification.updatedAt = new Date();

  await notification.save();
  return notification;
};

export default {
  createNotification,
  deleteNotification,
  getNotifications,
  updateNotification,
  getAllActiveNotifications,
  pauseNotification,
};
