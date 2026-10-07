import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import { clanController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';

const clanRouter = (router: Router) => {
  router.route('/fetch-location-profiles').post(verifyUser, clanController.fetchClanProfiles);
  router.route('/update-location').post(verifyUser, clanController.updateClanLocation);
  router.route('/most-active').get(verifyUser, clanController.fetchClanProfilesMostActive);
  router.route('/fetch-location-profiles-photos').post(verifyUser, clanController.fetchClanProfilesPhotos);
  router.route('/search').post(verifyUser, clanController.fetchClanProfilesByLocationController);

  //ADMIN
  router.route('/fetch-clan-users').get(verifyAdmin, clanController.fetchClanUsers);

  return router;
};

export default clanRouter;
