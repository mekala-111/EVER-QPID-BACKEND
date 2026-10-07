import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import dashboardController from '../../../controllers/dashboard-controller';

const dashboardRouter = (router: Router) => {
  router.route('/dashboard-summary').get(verifyAdmin, dashboardController.getDashboardSummary);
  router.route('/dashboard-overall-summary').get(verifyAdmin, dashboardController.getDashboardOverallSummary);
  router.route('/most-active-clans-chart').get(verifyAdmin, dashboardController.getMostActiveClans);
  router.route('/user-gender-chart').get(verifyAdmin, dashboardController.getUserGenderChart);
  router.route('/dashboard-csv-data').get(verifyAdmin, dashboardController.getDashboardCSVData);

  return router;
};

export default dashboardRouter;
