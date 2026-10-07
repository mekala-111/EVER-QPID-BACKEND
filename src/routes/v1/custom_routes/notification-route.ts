import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import { pushNotificationController, notificationController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';

const notificationRouter = (router: Router) => {
  // Admin routes

  router.post('/create-push-notification', verifyAdmin, pushNotificationController.addNotification);
  router.delete('/delete-push-notification/:notificationId', verifyAdmin, pushNotificationController.deleteNotification);
  router.put('/update-push-notification/:notificationId', verifyAdmin, pushNotificationController.updateNotification);
  router.get('/get-push-notifications', verifyAdmin, pushNotificationController.getNotifications);
  router.patch('/pause-notification/:notificationId', verifyAdmin, pushNotificationController.pauseNotification);

  //User
  router.route('/listNotification').get(verifyUser, notificationController.listNotifications);
  router.route('/getNotificationCount').get(verifyUser, notificationController.getNotificationCount);
  router.route('/deleteNotification/:notificationId').delete(verifyUser, notificationController.deleteNotification);
  router.route('/deleteAllNotification').delete(verifyUser, notificationController.deleteAllNotifications);
  router.route('/markAsRead/:notificationId').patch(verifyUser, notificationController.markAsRead);
  router.route('/markAllAsRead').patch(verifyUser, notificationController.markAllAsRead);
  return router;
};

export default notificationRouter;
