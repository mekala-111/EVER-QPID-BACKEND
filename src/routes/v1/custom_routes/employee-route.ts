import { Router } from 'express';
import employeeController from '../../../controllers/employee-controller';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import hostController from '../../../controllers/host-controller';
import { verifyEmployee } from '../../../middlewares/auth/verify-employee';
import { userController } from '../../../controllers';

const employeeRouter = (router: Router) => {
  router.route('/get-all-employees').get(verifyAdmin, employeeController.getEmployees);
  router.route('/create-employee').post(verifyAdmin, employeeController.createEmployee);
  router.route('/employees/:employeeId/assigned-hosts').get(verifyAdmin, employeeController.getAssignedHosts);

  //employee
  router.route('/assigned-hosts').get(verifyEmployee, hostController.getAssignedHosts);

  router.route('/edit-employee/:employeeId').put(verifyAdmin, employeeController.editEmployee);
  router.route('/delete-employee/:employeeId').delete(verifyAdmin, employeeController.deleteEmployee);
  router.route('/chat-support-employees').get(verifyAdmin, employeeController.getChatSupportEmployees);

  router.route('/employees/:employeeId/hosts/:hostId/recent-chats').get(verifyAdmin, hostController.getHostRecentChatsListController);
  //router.route('/host-locations').get(verifyAdmin, employeeController.getAllHostLocations);
  router.route('/host-locations').get(verifyAdmin, employeeController.getUniqueHostLocations);

  router.route('/host-languages').get(verifyAdmin, employeeController.getUniqueHostLanguages);

  router.route('/employees/:employeeId/hosts/:hostId/chats/:userId/mark-read').put(verifyAdmin, hostController.markHostConversationReadController);

  router.route('/recent-chat/:hostId').get(verifyEmployee, hostController.getRecentChats);

  router.route('/logout').post(verifyEmployee, employeeController.logout);

  //employee
  router.route('/host-locations-employee').get(verifyEmployee, employeeController.getUniqueHostLocationsByEmployee);

  router.route('/host-languages-employee').get(verifyEmployee, employeeController.getUniqueHostLanguages);

  router.route('/history/host/:hostId/user/:userId/chat').get(verifyEmployee, employeeController.fetchHostUserChatsEmployee);

  router.route('/:userId/details').get(verifyEmployee, userController.getUserWithPreferencesController);

  return router;
};

export default employeeRouter;
