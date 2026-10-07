import { Router } from 'express';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import supportController from '../../../controllers/support-controller';
import { ticketCategoryController } from '../../../controllers';

const supportRouter = (router: Router) => {
  router.post('/sent-support', verifyUser, supportController.sentSupport);
  router.get('/get-supports', verifyUser, supportController.getSupports);

  router.get('/user/get-all-ticket-categories', ticketCategoryController.getTicketCategoriesForUsers);

  return router;
};

export default supportRouter;
