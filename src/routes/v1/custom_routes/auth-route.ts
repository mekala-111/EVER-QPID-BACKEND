import { Router } from 'express';
import { authController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';

const authRouter = (router: Router) => {
  router.route('/user-auth').post(authController.authenticateUser);
  router.route('/check-user-exists').post(authController.checkUserExists);
  router.route('/log-out').post(verifyUser, authController.logOutUser);
  router.route('/refresh-tokens').post(authController.refreshTokens);
  router.route('/check-user-name-exists').post(authController.checkUserNameExists);
  router.route('/check-face-recognition').post(verifyUser, authController.checkFaceRecognition);
  router.route('/check-user-exists-email').post(authController.checkUserExistsByEmail);
  router.route('/sent-email-otp').post(authController.sendEmailOTP);
  router.route('/verify-admin-otp').post(authController.verifyOTP);
  router.route('/user-email-signup').post(authController.signUpUserByEmail);
  router.route('/user-email-login').post(authController.loginUserByEmail);
  return router;
};

export default authRouter;
