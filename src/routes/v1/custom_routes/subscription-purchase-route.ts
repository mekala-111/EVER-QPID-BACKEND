import { Router } from 'express';
import { subscriptionPurchaseController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const subscriptionPurchaseRouter = (router: Router) => {
  // USER
  router.route('/get-my-orders-subscription').get(verifyUser, subscriptionPurchaseController.getUserOrders);
  router.route('/create-payment-subscription').post(verifyUser, subscriptionPurchaseController.createPayment);
  router.route('/verify-payment-subscription').post(verifyUser, subscriptionPurchaseController.verifyPayment);

  // ADMIN
  router.route('/get-all-orders-subscription').get(verifyAdmin, subscriptionPurchaseController.getAllCoinOrdersAdmin);
  router.route('/get-revenue-subscription').get(verifyAdmin, subscriptionPurchaseController.getRevenue);
  router.route('/get-user-orders-subscriptions/:userId').get(verifyAdmin, subscriptionPurchaseController.getUserOrdersAdmin);
  router.route('/transaction-details/:userId').get(verifyAdmin, subscriptionPurchaseController.getUserTransactions);

  return router;
};

export default subscriptionPurchaseRouter;
