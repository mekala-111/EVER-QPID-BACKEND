import ChatMessageEntity from '../entities/chatMessage-entity';
import ERROR from '../middlewares/web_server/http-error';
import CHATSMESSAGES from '../models/chatMessage/chatMessage';
import { IChatMessage } from '../models/chatMessage/chatMessage-model';
import CHATREADSTATUS from '../models/chatMessage/chatReadStatus';
import USER from '../models/user/user';
import mongoose, { Types } from 'mongoose';
import matchingRepository from './matching-repository';
import calculateAgeHelper from '../helper/calculateAgeHelper';
import BLOCK from '../models/block/block';

/**
 * Create a new chat message.
 * @param {IChatMessage} messageData - The data to create the message with.
 * @returns {Promise<ChatMessageEntity>} The created chat message document.
 */
const create = async (messageData: ChatMessageEntity): Promise<IChatMessage> => {
  const newMessage = new CHATSMESSAGES(messageData);
  return await newMessage.save();
};

/**
 * Get messages exchanged between two users (regardless of direction)
 * @param {string} senderId - The logged-in user's ID
 * @param {string} receiverId - The other user's ID
 * @param {PaginationInput} pagination - Pagination options
 * @returns {Promise<{ data: IChatMessage[]; totalCount: number; hasNext: boolean }>}
 */
const getMessagesBetweenUsers = async (
  senderId: string,
  receiverId: string,
  //pagination: PaginationInput,
): Promise<{ data: IChatMessage[]; totalCount: number }> => {
  const senderObjectId = new Types.ObjectId(senderId);
  const receiverObjectId = new Types.ObjectId(receiverId);

  const filters = {
    deletedBy: { $ne: senderObjectId },
    $or: [
      { senderId: senderObjectId, receiverId: receiverObjectId },
      { senderId: receiverObjectId, receiverId: senderObjectId },
    ],
  };

  const excludedItems = '-__v -createdUser -updatedUser -updatedAt -documentStatus';

  const data = await CHATSMESSAGES.find(filters).sort({ createdAt: -1 }).select(excludedItems).exec();

  const totalCount = data.length;
  return { data, totalCount };
};

const upsertLastReadStatus = async (userId: string, withUserId: string, timestamp: Date) => {
  return await CHATREADSTATUS.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), withUserId: new Types.ObjectId(withUserId) },
    { lastReadAt: timestamp },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const getLastReadStatus = async (userId: string, withUserId: string) => {
  return await CHATREADSTATUS.findOne({
    userId: new Types.ObjectId(userId),
    withUserId: new Types.ObjectId(withUserId),
  });
};

/**
 * Get recent chats with user details
 * @param {string} userId - Current user ID
 * @returns {Promise<{
 *   withUserId: string;
 *   lastMessage: string;
 *   sentAt: Date;
 *   userDetails: {
 *     name: string;
 *     profileImageUrl: string[];
 *     isOnline: boolean;
 *     gender: string;
 *   };
 * }[]>}
 */

const getRecentChats = async (userId: string, search: string = '', pageNumber: number = 1, pageSize: number = 10) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error(`Invalid userId provided: ${userId}`);
  }

  const userObjectId = new Types.ObjectId(userId);

  let recentChats = await CHATSMESSAGES.aggregate([
    {
      $match: {
        deletedBy: { $ne: userObjectId },
        $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      },
    },
    { $sort: { sentAt: -1 } },
    {
      $project: {
        senderId: 1,
        receiverId: 1,
        //message: '$content',
        message: {
          $switch: {
            branches: [
              { case: { $eq: ['$type', 'text'] }, then: '$content' },
              { case: { $eq: ['$type', 'image'] }, then: '📷 Photo' },
              { case: { $eq: ['$type', 'audio'] }, then: '🎤 Voice message' },
              { case: { $eq: ['$type', 'video'] }, then: '🎥 Video' },
            ],
            default: '[Unknown]',
          },
        },
        sentAt: 1,
        withUserId: {
          $cond: [{ $eq: ['$senderId', userObjectId] }, '$receiverId', '$senderId'],
        },
      },
    },
    {
      $group: {
        _id: '$withUserId',
        lastMessage: { $first: '$message' },
        sentAt: { $first: '$sentAt' },
      },
    },
    {
      $addFields: {
        lastMessage: { $ifNull: ['$lastMessage', ''] },
      },
    },
  ]);

  const mutualMatches = await matchingRepository.getMutualMatchIds(userObjectId);

  const chatUserIds = recentChats.map((c) => c._id.toString());
  const unmatchedIds = mutualMatches.map((id) => id.toString()).filter((id) => !chatUserIds.includes(id));

  if (unmatchedIds.length > 0) {
    const unmatchedUsers = await USER.find({ _id: { $in: unmatchedIds } })
      .select('fullName profileImageUrl isOnline gender')
      .lean();

    unmatchedUsers.forEach((u) => {
      recentChats.push({
        _id: u._id,
        lastMessage: 'Send your first message',
        sentAt: null,
      });
    });
  }

  const userIds = recentChats.map((c) => c._id);
  const users = await USER.find({ _id: { $in: userIds } })
    .select('fullName profileImageUrl isOnline gender')
    .lean();

  recentChats = recentChats.map((chat) => {
    const user = users.find((u) => u._id.toString() === chat._id.toString());
    return {
      withUserId: chat._id,
      lastMessage: chat.lastMessage,
      sentAt: chat.sentAt,
      unreadCount: 0,
      isBlock: false,
      isOppositeBlock: false,
      userDetails: {
        name: user?.fullName || '',
        profileImageUrl: user?.profileImageUrl || '',
        isOnline: user?.isOnline || false,
        gender: user?.gender || '',
      },
    };
  });

  const chatIds = recentChats.map((c) => c.withUserId);
  const unreadCounts = await CHATSMESSAGES.aggregate([
    {
      $match: {
        senderId: { $in: chatIds.map((id) => new Types.ObjectId(id)) },
        receiverId: userObjectId,
        isRead: false,
      },
    },
    {
      $group: {
        _id: '$senderId',
        count: { $sum: 1 },
      },
    },
  ]);
  const unreadMap = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));

  const blocks = await BLOCK.find({
    $or: [
      { blockedBy: userObjectId, blockedAccount: { $in: chatIds } },
      { blockedBy: { $in: chatIds }, blockedAccount: userObjectId },
    ],
  }).lean();

  const blockMap = new Map<string, { isBlock: boolean; isOppositeBlock: boolean }>();
  blocks.forEach((b) => {
    if (b.blockedBy.toString() === userId) {
      blockMap.set(b.blockedAccount.toString(), { isBlock: true, isOppositeBlock: false });
    } else {
      blockMap.set(b.blockedBy.toString(), { isBlock: false, isOppositeBlock: true });
    }
  });

  recentChats = recentChats.map((c) => {
    const blockInfo = blockMap.get(c.withUserId.toString()) || { isBlock: false, isOppositeBlock: false };
    return {
      ...c,
      unreadCount: unreadMap.get(c.withUserId.toString()) || 0,
      isBlock: blockInfo.isBlock,
      isOppositeBlock: blockInfo.isOppositeBlock,
    };
  });

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    recentChats = recentChats.filter((c) => regex.test(c.userDetails.name));
  }

  recentChats.sort((a, b) => {
    if (!a.sentAt && !b.sentAt) return 0;
    if (!a.sentAt) return 1;
    if (!b.sentAt) return -1;
    return b.sentAt.getTime() - a.sentAt.getTime();
  });

  const totalCount = recentChats.length;
  const start = (pageNumber - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: recentChats.slice(start, end),
    totalCount,
    pageNumber,
    pageSize,
    hasNext: end < totalCount,
  };
};

const clearMessageHistory = async (userId: string, chatWith: string): Promise<void> => {
  const chatWithId = new Types.ObjectId(chatWith);
  const userObjectId = new Types.ObjectId(userId);
  const result = await CHATSMESSAGES.updateMany(
    {
      $or: [
        { senderId: userObjectId, receiverId: chatWithId },
        { senderId: chatWithId, receiverId: userObjectId },
      ],
    },
    { $set: { deletedBy: userObjectId } },
  );
  if (result.modifiedCount === 0) {
    throw new ERROR.BadRequestError('Failed to delete messages');
  }
};

const deleteAllMessages = async (userId: string, chatWith: string): Promise<void> => {
  const chatWithId = new Types.ObjectId(chatWith);
  const userObjectId = new Types.ObjectId(userId);
  await CHATSMESSAGES.deleteMany(
    {
      $or: [
        { senderId: userObjectId, receiverId: chatWithId },
        { senderId: chatWithId, receiverId: userObjectId },
      ],
    },
    { $set: { deletedBy: userObjectId } },
  );
};

const getRecentChatsByAdmin = async (
  userId: string,
): Promise<
  {
    fullName: string;
    chartStartedOn: Date;
    chatCount: number;
    status: boolean;
  }[]
> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error(`Invalid userId provided: ${userId}`);
  }

  const userObjectId = new Types.ObjectId(userId);

  const recentChats = await CHATSMESSAGES.aggregate([
    {
      $match: {
        deletedBy: { $ne: userObjectId },
        $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      },
    },
    {
      $project: {
        withUserId: {
          $cond: [{ $eq: ['$senderId', userObjectId] }, '$receiverId', '$senderId'],
        },
        sentAt: 1,
      },
    },
    {
      $group: {
        _id: '$withUserId',
        chartStartedOn: { $min: '$sentAt' },
        chatCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'cln_users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    { $unwind: '$userDetails' },

    {
      $project: {
        _id: 0,
        fullName: '$userDetails.fullName',
        chatStartedOn: 1,
        chatCount: 1,
        status: '$userDetails.isOnline',
      },
    },

    { $sort: { chartStartedOn: -1 } },
  ]);

  return recentChats;
};

const countMessagesBetweenUsers = async (senderId: string, receiverId: string): Promise<number> => {
  return CHATSMESSAGES.countDocuments({
    senderId,
    receiverId,
    documentStatus: true,
  });
};

const getChatHistoryBetweenUsers = async (hostId: string, userId: string, pageNumber: number, pageSize: number) => {
  if (!mongoose.Types.ObjectId.isValid(hostId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid hostId or userId');
  }

  const hostObjectId = new Types.ObjectId(hostId);
  const userObjectId = new Types.ObjectId(userId);

  /* ---------------- CHAT MESSAGES ---------------- */
  const matchCondition = {
    documentStatus: true,
    $or: [
      { senderId: hostObjectId, receiverId: userObjectId },
      { senderId: userObjectId, receiverId: hostObjectId },
    ],
  };

  const totalCount = await CHATSMESSAGES.countDocuments(matchCondition);

  const messages = await CHATSMESSAGES.aggregate([
    { $match: matchCondition },
    { $sort: { sentAt: 1 } },
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },

    {
      $lookup: {
        from: 'cln_users',
        localField: 'senderId',
        foreignField: '_id',
        as: 'sender',
      },
    },
    { $unwind: '$sender' },

    {
      $lookup: {
        from: 'cln_users',
        localField: 'receiverId',
        foreignField: '_id',
        as: 'receiver',
      },
    },
    { $unwind: '$receiver' },

    {
      $project: {
        _id: 1,
        type: 1,
        content: 1,
        mediaUrl: 1,
        isRead: 1,
        sentAt: 1,
        sender: {
          _id: '$sender._id',
          name: '$sender.fullName',
          profileImageUrl: '$sender.profileImageUrl',
          role: '$sender.userType',
          isOnline: '$sender.isOnline',
        },
        receiver: {
          _id: '$receiver._id',
          name: '$receiver.fullName',
          profileImageUrl: '$receiver.profileImageUrl',
          role: '$receiver.userType',
          isOnline: '$receiver.isOnline',
        },
      },
    },
  ]);

  /* ---------------- HOST DETAILS ---------------- */
  const host = await USER.findById(hostObjectId)
    .populate({
      path: 'assignedEmployee',
      select: 'name',
    })
    .lean();

  const user = await USER.findById(userObjectId).lean();

  if (!host || !user) {
    throw new Error('Host or User not found');
  }

  const hostAge = host.dateOfBirth ? calculateAgeHelper(host.dateOfBirth) : null;

  const chatMeta = {
    host: {
      _id: host._id,
      name: host.fullName,
      profileImageUrl: host.profileImageUrl,
      age: hostAge,
      place: host.locationString || '',
      assignedEmployeeName: (host.assignedEmployee as any)?.name || null,
      isOnline: host.isOnline,
    },
    user: {
      _id: user._id,
      name: user.fullName,
      profileImageUrl: user.profileImageUrl,
      isOnline: user.isOnline,
    },
  };

  return {
    chatMeta,
    messages,
    totalCount,
    pageNumber,
    pageSize,
    hasNext: pageNumber * pageSize < totalCount,
  };
};

const getRecentChatsForAdmin = async (search: string = '', pageNumber: number = 1, pageSize: number = 20) => {
  const skip = (pageNumber - 1) * pageSize;

  const matchStage: any = { documentStatus: true };

  const aggregatePipeline: any[] = [
    { $match: matchStage },

    {
      $group: {
        _id: {
          $cond: [{ $lt: ['$senderId', '$receiverId'] }, { user1: '$senderId', user2: '$receiverId' }, { user1: '$receiverId', user2: '$senderId' }],
        },
        lastMessageAt: { $max: '$sentAt' },
        lastMessage: { $last: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $eq: ['$isRead', false] }, 1, 0],
          },
        },
      },
    },

    { $sort: { lastMessageAt: -1 } },

    { $skip: skip },
    { $limit: pageSize },

    {
      $lookup: {
        from: 'cln_users',
        let: { userId: '$_id.user2' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$userId'] } } }, { $project: { fullName: 1, profileImageUrl: 1 } }],
        as: 'userInfo',
      },
    },
    { $unwind: '$userInfo' },
  ];

  if (search) {
    aggregatePipeline.push({
      $match: {
        'userInfo.fullName': { $regex: search, $options: 'i' },
      },
    });
  }

  aggregatePipeline.push({
    $project: {
      _id: 0,
      chatId: '$_id',
      lastMessage: {
        content: '$lastMessage.content',
        type: '$lastMessage.type',
        sentAt: '$lastMessage.sentAt',
      },
      unreadCount: 1,
      user: {
        _id: '$userInfo._id',
        name: '$userInfo.fullName',
        profileImageUrl: '$userInfo.profileImageUrl',
      },
    },
  });

  const chats = await CHATSMESSAGES.aggregate(aggregatePipeline);

  const allChats = await CHATSMESSAGES.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $cond: [{ $lt: ['$senderId', '$receiverId'] }, { user1: '$senderId', user2: '$receiverId' }, { user1: '$receiverId', user2: '$senderId' }],
        },
      },
    },
  ]);
  const totalCount = allChats.length;

  return {
    totalCount,
    pageNumber,
    pageSize,
    hasNext: pageNumber * pageSize < totalCount,
    chats,
  };
};

interface FetchChatsRepoOptions {
  hostId: string;
  userId: string;
  skip?: number;
  limit?: number;
}

const fetchHostUserChatsRepo = async ({ hostId, userId, skip = 0, limit = 20 }: FetchChatsRepoOptions) => {
  return CHATSMESSAGES.find({
    $or: [
      { senderId: hostId, receiverId: userId },
      { senderId: userId, receiverId: hostId },
    ],
    documentStatus: true,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const markChatAsRead = async (userId: string, withUserId: string) => {
  const userObjectId = new Types.ObjectId(userId);
  const withUserObjectId = new Types.ObjectId(withUserId);
  const now = new Date();

  await CHATREADSTATUS.findOneAndUpdate(
    { userId: userObjectId, withUserId: withUserObjectId },
    { $set: { lastReadAt: now } },
    { upsert: true, new: true },
  );

  await CHATSMESSAGES.updateMany(
    {
      senderId: withUserObjectId,
      receiverId: userObjectId,
      isRead: false,
    },
    { $set: { isRead: true } },
  );
};

export default {
  create,
  getMessagesBetweenUsers,
  upsertLastReadStatus,
  getLastReadStatus,
  getRecentChats,
  clearMessageHistory,
  deleteAllMessages,
  getRecentChatsByAdmin,
  countMessagesBetweenUsers,
  getChatHistoryBetweenUsers,
  getRecentChatsForAdmin,
  fetchHostUserChatsRepo,
  markChatAsRead,
};
