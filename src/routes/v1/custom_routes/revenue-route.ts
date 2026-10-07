import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import revenueController from '../../../controllers/revenue-controller';

const revenueRouter = (router: Router) => {
  // ADMIN
  router.route('/get-all-transactions').get(verifyAdmin, revenueController.getAllTransactions);
  router.route('/revenue-summary').get(verifyAdmin, revenueController.getRevenueSummary);
  router.route('/transaction/:transactionId').get(verifyAdmin, revenueController.getTransactionDetail);
  router.route('/transactions-status-chart').get(verifyAdmin, revenueController.getTransactionStatusChart);
  router.route('/export-transactions').get(verifyAdmin, revenueController.exportTransactions);

  return router;
};

export default revenueRouter;
