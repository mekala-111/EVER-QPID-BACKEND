import { Router } from 'express';
import { signedUrlController } from '../../../controllers';
// import { verifyUser } from '../../../middlewares/auth/verify-user';

const signedUrlRouter = (router: Router) => {
  router.route('/get-signed-url').post(signedUrlController.getSignedUrl);
  router.route('/get-download-url').post(signedUrlController.getDownloadSignedUrl);

  return router;
};

export default signedUrlRouter;
