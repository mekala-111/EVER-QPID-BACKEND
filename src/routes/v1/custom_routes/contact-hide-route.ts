import { Router } from 'express';
import contactHideController from '../../../controllers/contact-hide-controller';
import { verifyUser } from '../../../middlewares/auth/verify-user';

const contactHideRouter = (router: Router) => {
  router.route('/import-contacts').post(verifyUser, contactHideController.importContacts);
  router.route('/hidden-contacts').get(verifyUser, contactHideController.getHiddenContacts);
  router.route('/remove-hidden-contacts').post(verifyUser, contactHideController.removeHiddenContact);

  return router;
};

export default contactHideRouter;
