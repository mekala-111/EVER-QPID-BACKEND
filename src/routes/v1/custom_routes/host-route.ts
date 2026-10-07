import { Router } from 'express';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';
import hostController from '../../../controllers/host-controller';
import { verifyEmployee } from '../../../middlewares/auth/verify-employee';

const hostRouter = (router: Router) => {
  router.route('/admin-host').post(verifyAdmin, hostController.createHostProfileController);
  router.route('/admin-host/:hostId').put(verifyAdmin, hostController.updateHostProfileController);
  router.route('/admin-host').get(verifyAdmin, hostController.getAllHostsController);
  router.route('/admin-host/:hostId').get(verifyAdmin, hostController.getHostDetailsController);
  router.route('/admin-host/:hostId/photos').get(verifyAdmin, hostController.getHostPhotosController);
  router.route('/admin-host/:hostId/match').get(verifyAdmin, hostController.getHostMachingController);
  router.route('/admin-host/:hostId/sent-likes').get(verifyAdmin, hostController.getHostSentLikesController);
  router.route('/admin-host/:hostId/send-like').post(verifyAdmin, hostController.sendLikeController);
  router.route('/admin-host/:hostId/users').get(verifyAdmin, hostController.getUsersForHostController);
  router.route('/admin-host/:hostId').delete(verifyAdmin, hostController.deleteHostController);

  //employee
  router.route('/:hostId/users').get(verifyEmployee, hostController.getUsersForHostControllerForEmployee);
  router.route('/:hostId/send-like').post(verifyEmployee, hostController.sendLikeControllerByEmployee);
  router.route('/hosts').get(verifyEmployee, hostController.getHostsByEmployeeController);

  return router;
};

export default hostRouter;
