import { Router } from 'express';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import messageController from '../../../controllers/message-controller';

const adminMessageRouter = (router: Router) => {
  router.route('/admin/send-message').post(verifyAdmin, messageController.sendMessage);

  router.route('/user/messages').get(verifyUser, messageController.getUserMessages);

  router.route('/user/messages/:messageId/read').patch(verifyUser, messageController.markAsRead);

  return router;
};

export default adminMessageRouter;
