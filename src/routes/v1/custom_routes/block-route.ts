import { Router } from 'express';
import { blockController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const blockRouter = (router: Router) => {
  // USER Routes: Users can block/unblock other users
  router.route('/block-user').post(verifyUser, blockController.blockUser); // User blocking another user
  router.route('/unblock-user/:blockedUserId').delete(verifyUser, blockController.unblockUser); // User unblocking another user
  router.route('/users/blocked-list/get-all').get(verifyUser, blockController.getAllBlockedUsers);
  // Admin Routes: Admins can block/unblock users
  router.route('/admin/block-user').post(verifyAdmin, blockController.blockUserAdmin); // Admin blocking a user
  router.route('/admin/unblock-user/:blockedUserId').delete(verifyAdmin, blockController.unblockUserAdmin); // Admin unblocking a user
  router.route('/admin/blocked-list/get-all').get(verifyAdmin, blockController.getAllBlockedAdmin);

  return router;
};

export default blockRouter;
