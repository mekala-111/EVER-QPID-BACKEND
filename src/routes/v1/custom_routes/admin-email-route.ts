import { Router } from 'express';
import adminEmailController from '../../../controllers/admin-email-controller';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const adminEmailRouter = (router: Router) => {
  router.route('/get-email').get(verifyAdmin, adminEmailController.getAdminEmail);
  router.route('/update-email').put(verifyAdmin, adminEmailController.updateAdminEmail);

  return router;
};

export default adminEmailRouter;
