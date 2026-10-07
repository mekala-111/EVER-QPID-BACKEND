import { Router } from 'express';
import { chatMessageController } from '../../../controllers';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const chatMessageRouter = (router: Router) => {
  router.route('/chat-history/:receiverId').get(verifyUser, chatMessageController.getUserChatWith);
  router.route('/recent-chat-list').get(verifyUser, chatMessageController.getRecentChats);
  router.route('/delete-all-message/:chatWith').delete(verifyUser, chatMessageController.clearChatHistory);
  router.route('/sent-message').post(verifyUser, chatMessageController.sendMessage);

  //ADMIN
  router.route('/admin/chat-logs/:userId').get(verifyAdmin, chatMessageController.getChatLogsByAdmin);
  router.route('/recent-chat-list-host/:userId').get(verifyAdmin, chatMessageController.getRecentChatsHost);
  router.route('/chat-history-host/:receiverId').get(verifyAdmin, chatMessageController.getUserChatWith);
  router.route('/host-chat/block').post(verifyAdmin, chatMessageController.blockHostChatUser);
  router.route('/chat-history-byAdmin/:hostId/:userId').get(verifyAdmin, chatMessageController.getChatHistoryForAdmin);
  router.route('/recent-chats-admin').get(verifyAdmin, chatMessageController.getRecentChatsAdmin);
  router.route('/host/:hostId/user/:userId/chat').get(verifyAdmin, chatMessageController.fetchHostUserChats);
  return router;
};

export default chatMessageRouter;
