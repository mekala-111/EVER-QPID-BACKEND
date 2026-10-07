import { Express, Router, Response } from 'express';
import { adminEmailRouter, authRouter, blockRouter, clanRouter, employeeRouter, interestRouter, signedUrlRouter } from './v1/custom_routes';
import profileRouter from './v1/custom_routes/profile-route';
import matchingRouter from './v1/custom_routes/matching-route';
import chatMessageRouter from './v1/custom_routes/chatMessage-route';
import supportRouter from './v1/custom_routes/support-route';
import contactHideRouter from './v1/custom_routes/contact-hide-route';
import agoraAccessTokenRouter from './v1/custom_routes/agora-access-token-route';
import adminRouter from './v1/custom_routes/admin-route';
import { ticketCategoryRouter } from './v1/custom_routes';
import notificationRouter from './v1/custom_routes/notification-route';
import hostRouter from './v1/custom_routes/host-route';
import subscriptionRouter from './v1/custom_routes/subscription-route';
import subscriptionPurchaseRouter from './v1/custom_routes/subscription-purchase-route';
import revenueRouter from './v1/custom_routes/revenue-route';
import ticketRouter from './v1/custom_routes/ticket-route';
import reportRouter from './v1/custom_routes/report-route';
import dashboardRouter from './v1/custom_routes/dashboard-route';
import adminMessageRouter from './v1/custom_routes/admin-message-route';
import fcmRouter from './v1/custom_routes/fcm-route';

export const routes = (app: Express) => {
  const router = Router();

  // custom route goes here
  router.use('/api/v1/signed-url', signedUrlRouter(router));
  router.use('/api/v1/auth', authRouter(router));
  router.use('/api/v1/profile', profileRouter(router));
  router.use('/api/v1/matching', matchingRouter(router));
  router.use('/api/v1/chat-Message', chatMessageRouter(router));
  router.use('/api/v1/contacts', contactHideRouter(router));
  router.use('/api/v1/agora-access-token', agoraAccessTokenRouter(router));
  router.use('/api/v1/clan', clanRouter(router));
  router.use('/api/v1/report', reportRouter(router));
  router.use('/api/v1/block', blockRouter(router));

  router.use('/api/v1/admin', adminRouter(router));
  router.use('/api/v1/email', adminEmailRouter(router));
  router.use('/api/v1/dashboard', dashboardRouter(router));

  router.use('/api/v1/employee', employeeRouter(router));
  router.use('/api/v1/support', supportRouter(router));

  router.use('/api/v1/admin/interest', interestRouter(router));
  router.use('/api/v1/ticket-Category', ticketCategoryRouter(router));
  router.use('/api/v1/notification', notificationRouter(router));
  router.use('/api/v1/host', hostRouter(router));
  router.use('/api/v1/subscription-plans', subscriptionRouter(router));
  router.use('/api/v1/subscription-purchase', subscriptionPurchaseRouter(router));
  router.use('/api/v1/revenue', revenueRouter(router));
  router.use('/api/v1/tickets', ticketRouter(router));
  router.use('/api/v1/message', adminMessageRouter(router));
  router.use('/api/v1/fcm', fcmRouter(router));

  // default route
  router.get('/', (res: Response) => {
    res.send('This is the router home page');
  });

  app.use(router);
};

export default routes;
