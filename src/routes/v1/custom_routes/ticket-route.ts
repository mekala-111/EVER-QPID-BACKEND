import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import ticketController from '../../../controllers/ticket-controller';

const ticketRouter = (router: Router) => {
  router.route('/all-tickets').get(verifyAdmin, ticketController.getAllTickets);
  router.route('/assign-ticket/:ticketId').put(verifyAdmin, ticketController.assignTicket);
  router.route('/create-ticket').post(verifyAdmin, ticketController.createTicket);
  router.route('/:ticketId').get(verifyAdmin, ticketController.getTicketById);
  router.route('/close-ticket/:ticketId').put(verifyAdmin, ticketController.closeTicket);
  router.route('/tickets-details/:userId').get(verifyAdmin, ticketController.getUserTickets);
  router.route('/cancel-ticket/:ticketId').put(verifyAdmin, ticketController.cancelTicket);

  return router;
};

export default ticketRouter;
