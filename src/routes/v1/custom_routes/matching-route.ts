import { Router } from 'express';
import matchingController from '../../../controllers/matching-controller';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import { verifyEmployee } from '../../../middlewares/auth/verify-employee';

const matchingRouter = (router: Router) => {
  // USER ROUTES
  router.route('/like-send').post(verifyUser, matchingController.likeProfile);
  router.route('/unlike/:userId').delete(verifyUser, matchingController.unLikeProfile);
  router.route('/get-my-matches').get(verifyUser, matchingController.getMutualMatches);
  router.route('/get-my-liked-profiles').get(verifyUser, matchingController.getUserLikedProfiles);
  router.route('/get-received-likes').get(verifyUser, matchingController.getReceivedLikes);
  router.route('/superLike-send').post(verifyUser, matchingController.superLikeProfile);

  // ADMIN ROUTES
  router.route('/get-all-matches').get(verifyAdmin, matchingController.getAllMatches);
  router.route('/admin/get-user-matches/:userId').get(verifyAdmin, matchingController.getUserMatchesAdmin);
  router.route('/get-match-stats').get(verifyAdmin, matchingController.getMatchStats);

  //EMPLOYEE
  router.route('/host/:hostId/received-likes').get(verifyEmployee, matchingController.getReceivedLikesForHost);
  router.route('/host/:hostId/like-back').post(verifyEmployee, matchingController.likeBackFromHost);

  return router;
};

export default matchingRouter;
