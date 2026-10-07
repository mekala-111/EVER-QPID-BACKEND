import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import { ticketCategoryController } from '../../../controllers';

const ticketCategoryRouter = (router: Router) => {
  // Admin routes
  router.post('/create-ticket-category', verifyAdmin, ticketCategoryController.addTicketCategory);
  router.put('/update-ticket-category/:ticketCategoryId', verifyAdmin, ticketCategoryController.updateTicketCategory);
  router.delete('/delete-ticket-category/:ticketCategoryId', verifyAdmin, ticketCategoryController.deleteTicketCategory);
  router.get('/get-ticket-categories', verifyAdmin, ticketCategoryController.getTicketCategories);
  router.get('/get-ticket-category/:id', verifyAdmin, ticketCategoryController.getTicketCategoryById);

  // User routes
  router.get('/user/get-all-ticket-categories', ticketCategoryController.getTicketCategoriesForUsers);
  router.get('/user/get-ticket-category-details/:id', ticketCategoryController.getTicketCategoryByIdUser);

  return router;
};

export default ticketCategoryRouter;
