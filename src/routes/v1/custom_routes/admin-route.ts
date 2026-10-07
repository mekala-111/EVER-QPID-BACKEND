import { Router } from 'express';
import adminController from '../../../controllers/admin-controller';

const adminRouter = (router: Router) => {
  router.route('/register').post(adminController.addAdmin);
  router.route('/login').post(adminController.login);

  router.route('/forgot-password').post(adminController.forgotPassword);
  router.route('/verify-otp').post(adminController.verifyOtp);
  router.route('/set-new-password').post(adminController.setNewPassword);

  return router;
};

export default adminRouter;
