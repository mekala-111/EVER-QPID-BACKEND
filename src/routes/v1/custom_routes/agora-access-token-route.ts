import { Response, NextFunction, Router } from 'express';
import agoraAccessTokenController from '../../../controllers/agora-access-token-controller';

const agoraAccessTokenRouter = (router: Router) => {
  const nocache = (_: any, resp: Response, next: NextFunction) => {
    resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    resp.header('Expires', '-1');
    resp.header('Pragma', 'no-cache');
    next();
  };
  router.route('/rtm/:uid').get(nocache, agoraAccessTokenController.generateRTMToken);
  return router;
};

export default agoraAccessTokenRouter;
