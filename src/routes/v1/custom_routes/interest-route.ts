import { Router } from 'express';
import { interestController } from '../../../controllers';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const interestRouter = (router: Router) => {
  // USER
  router.route('/get-all-interest').get(interestController.getInterests);
  // ADMIN
  router.route('/create-user-interest').post(verifyAdmin, interestController.createUserInterest);
  router.route('/edit-user-interest/:interestId').put(verifyAdmin, interestController.editUserInterest);
  router.route('/delete-user-interest/:interestId').delete(verifyAdmin, interestController.deleteUserInterest);
  return router;
};

export default interestRouter;
