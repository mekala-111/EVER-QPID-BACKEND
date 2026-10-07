import ERROR from '../middlewares/web_server/http-error';
import { IPushNotification } from '../models/push-notification/push-notification-model';
import { pushNotificationRepository, userRepository } from '../repositories';
import { removeNotification, scheduleNotification } from '../utils/notification-schedular-service';
import FirebaseService from '../utils/firebase-service';
import { Types } from 'mongoose';
/**
 * Add Notification
 * @param { any } obj
 * @param { string } adminId
 * @returns { Promise<INotification | null> }
 */
const addNotification = async (adminId: string, obj: any): Promise<IPushNotification | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('Unauthorized');
  if (!obj.title) throw new ERROR.InvalidInputError('Title is required');

  if (obj.toDate) obj.toDate = new Date(obj.toDate).setHours(23, 59, 59, 999);

  const notification = await pushNotificationRepository.createNotification(obj);
  if (notification && notification._id) {
    scheduleNotification(notification);
  }
  return notification;
};

/**
 * Delete Notification (Soft Delete)
 * @param { string } adminId
 * @param { string } id
 * @returns { Promise<any | null> }
 */
const deleteNotification = async (adminId: string, id: string): Promise<any | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('Unauthorized');
  if (!id) throw new ERROR.InvalidInputError('Please select a notification');

  const update = {
    documentStatus: false,
    updatedAt: new Date(),
  };

  const notification = await pushNotificationRepository.deleteNotification(id, update);
  if (notification && notification._id) {
    removeNotification(notification);
  }
  return notification;
};

/**
 * Update Notification
 * @param { string } adminId
 * @param { string } id
 * @returns { Promise<any | null> }
 */
const updateNotification = async (adminId: string, id: string, obj: any): Promise<any | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('Unauthorized');
  if (!id) throw new ERROR.InvalidInputError('Please select a notification');

  if (obj.toDate) obj.toDate = new Date(obj.toDate).setHours(23, 59, 59, 999);

  const notification = await pushNotificationRepository.updateNotification(id, obj);
  if (notification && notification._id) {
    scheduleNotification(notification);
  }
  return notification;
};

/**
 * Get Notifications
 * @param { string } adminId
 * @returns { Promise<INotification[]> }
 */
const getNotifications = async (
  adminId: string,
  pageNumber: string,
  pageSize: string,
  searchTag: string,
  fromDate: string,
  toDate: string,
  notificationType: string,
): Promise<{ notifications: IPushNotification[]; count: number; hasNext: boolean }> => {
  if (!adminId) throw new ERROR.AuthorizationError('Unauthorized');
  return await pushNotificationRepository.getNotifications(pageNumber, pageSize, searchTag, fromDate, toDate, notificationType);
};

export const sendPushNotification = async (userIds: string | string[], context: string, variable: string, _id: string) => {
  console.log('sending push notification.......................');

  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const tokens: string[] = [];

  for (const userId of ids) {
    const userData = await userRepository.findUserById(new Types.ObjectId(userId));
    if (userData?.fcmTokens?.length) {
      tokens.push(...userData.fcmTokens);
    }
  }

  if (!tokens.length) return;

  let title = '';
  let message = '';
  let type = '';
  let actionId = ' ';

  switch (context) {
    case 'new_post':
      title = 'New Post Alert';
      message = `${variable} just posted something new. Check it out now!`;
      type = 'post';
      actionId = _id;
      break;

    case 'new_story':
      title = 'New Story';
      message = `${variable} added a new story. Tap to view it before it disappears!`;
      type = 'story';
      actionId = _id;
      break;

    case 'new_message':
      title = 'New Message';
      message = `${variable}.`;
      type = 'message';
      actionId = _id;
      break;

    case 'new_follower':
      title = 'New Follower';
      message = `${variable} started following you. Say hi!`;
      type = 'follow';
      actionId = _id;
      break;

    case 'profile_view':
      title = 'Profile Viewed';
      message = `${variable} viewed your profile.`;
      type = 'profileView';
      actionId = _id;
      break;

    case 'story_viewed':
      title = 'Story Viewed';
      message = `${variable} viewed your story.`;
      type = 'story';
      actionId = _id;
      break;

    case 'post_liked':
      title = 'New Like';
      message = `${variable} liked your post.`;
      type = 'like';
      actionId = _id;
      break;

    case 'post_commented':
      title = 'New Comment';
      message = `${variable} commented on your post.`;
      type = 'comment';
      actionId = _id;
      break;

    case 'mention':
      title = 'You Were Mentioned';
      message = `${variable} mentioned you in a post or comment.`;
      type = 'post';
      actionId = _id;
      break;

    case 'subscription_expiry_soon':
      title = 'Subscription Expiring Soon';
      message = `Your subscription will expire in ${variable} days .Renew now to continue enjoying all features.`;
      type = 'subscription';
      actionId = _id;
      break;
    case 'admin_message':
      title = 'New Message';
      message = `${variable}.`;
      type = 'adminMessage';
      actionId = _id;
      break;
  }

  const firebaseService = new FirebaseService();
  await firebaseService.sendPushNotification(tokens, title, message, type, actionId);
};
const pauseNotification = async (notificationId: string, paused: boolean): Promise<IPushNotification> => {
  return await pushNotificationRepository.pauseNotification(notificationId, paused);
};

export default {
  addNotification,
  deleteNotification,
  getNotifications,
  updateNotification,
  pauseNotification,
  sendPushNotification,
};
