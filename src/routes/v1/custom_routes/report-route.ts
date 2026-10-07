import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import reportController from '../../../controllers/report-controller';
import { verifyUser } from '../../../middlewares/auth/verify-user';

const reportRouter = (router: Router) => {
  router.route('/report-user').post(verifyUser, reportController.reportUser);

  //ADMIN
  router.route('/reports/download').get(verifyAdmin, reportController.downloadReports);
  router.route('/reports').get(verifyAdmin, reportController.getReports);
  router.route('/reports/:reportedId').get(verifyAdmin, reportController.getReportedUserDetails);
  router.route('/reset-warnings/:userId').post(verifyAdmin, reportController.resetWarnings);
  router.route('/suspend-user/:userId').post(verifyAdmin, reportController.suspendUser);
  router.route('/activate-user/:userId').post(verifyAdmin, reportController.activateUser);

  return router;
};

export default reportRouter;
