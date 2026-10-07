import BLOCK from '../models/block/block';

export const isHostChatBlocked = async (senderId: string, receiverId: string): Promise<boolean> => {
  return !!(await BLOCK.exists({
    documentStatus: true,
    $or: [
      { blockedBy: senderId, blockedAccount: receiverId },
      { blockedBy: receiverId, blockedAccount: senderId },
    ],
  }));
};
