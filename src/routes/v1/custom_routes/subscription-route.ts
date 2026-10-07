import { Router } from 'express';
import { subscriptionController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const subscriptionRouter = (router: Router) => {
  // USER
  router.route('/user/get-all-subscriptions').get(verifyUser, subscriptionController.getAllSubscriptionsForUsers);
  // ADMIN
  router.route('/get-all-subscriptions').get(verifyAdmin, subscriptionController.getAllSubscriptions);
  router.route('/toggle-subscription/:subscriptionId').patch(verifyAdmin, subscriptionController.toggleSubscriptionStatus);
  router.route('/get-subscription-details/:subscriptionId').get(verifyAdmin, subscriptionController.getSubscriptionDetails);
  router.route('/add-subscription').post(verifyAdmin, subscriptionController.createSubscription);
  router.route('/update-subscription/:subscriptionId').put(verifyAdmin, subscriptionController.updateSubscription);
  router.route('/delete-subscription/:subscriptionId').delete(verifyAdmin, subscriptionController.deleteSubscription);

  return router;
};

export default subscriptionRouter;
