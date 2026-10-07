import { Router } from 'express';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import fcmTokenController from '../../../controllers/fcmToken-controller';

const fcmRouter = (router: Router) => {
  router.route('/register-fcm').post(verifyUser, fcmTokenController.registerFcmToken);
  router.route('/remove-fcm').post(verifyUser, fcmTokenController.removeFcmToken);

  return router;
};

export default fcmRouter;
