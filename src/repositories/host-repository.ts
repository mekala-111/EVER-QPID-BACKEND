import CHATSMESSAGES from '../models/chatMessage/chatMessage';
import { Types } from 'mongoose';
import USER from '../models/user/user';

const getHostRecentChats = async ({
  employeeId,
  hostId,
  pageNumber,
  pageSize,
}: {
  employeeId: string;
  hostId: string;
  pageNumber: number;
  pageSize: number;
}): Promise<{ chats: any[]; totalCount: number; hasNext: boolean }> => {
  if (!Types.ObjectId.isValid(employeeId) || !Types.ObjectId.isValid(hostId)) {
    throw new Error('Invalid employeeId or hostId');
  }

  const host = await USER.findOne({ _id: hostId, assignedEmployee: employeeId }).lean();
  if (!host) {
    throw new Error('Host not found or not assigned to this employee');
  }

  const filter: any = {
    $or: [{ senderId: host._id }, { receiverId: host._id }],
  };

  const totalCount = await CHATSMESSAGES.countDocuments(filter);

  const chats = await CHATSMESSAGES.find(filter)
    .sort({ sentAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate({
      path: 'senderId',
      select: 'fullName profileImageUrl userType',
    })
    .populate({
      path: 'receiverId',
      select: 'fullName profileImageUrl userType',
    })
    .lean();

  return {
    chats,
    totalCount,
    hasNext: pageNumber * pageSize < totalCount,
  };
};

const getHostRecentChatsList = async (
  hostId: Types.ObjectId | string,
  filters: { locationString?: string; otherLanguages?: string[] },
  pageNumber: number,
  pageSize: number,
) => {
  const hostObjectId = typeof hostId === 'string' ? new Types.ObjectId(hostId) : hostId;

  const pipeline: any[] = [
    {
      $match: {
        documentStatus: true,
        $or: [{ senderId: hostObjectId }, { receiverId: hostObjectId }],
      },
    },
    { $sort: { sentAt: -1 } },
    {
      $addFields: {
        userId: { $cond: [{ $eq: ['$senderId', hostObjectId] }, '$receiverId', '$senderId'] },
      },
    },
    {
      $group: {
        _id: '$userId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$receiverId', hostObjectId] }, { $eq: ['$isRead', false] }] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'cln_users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  const userFilters: any = {};
  if (filters.locationString) {
    userFilters['user.locationString'] = { $regex: filters.locationString, $options: 'i' };
  }
  if (filters.otherLanguages?.length) userFilters['user.otherLanguages'] = { $in: filters.otherLanguages };
  if (Object.keys(userFilters).length) pipeline.push({ $match: userFilters });

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await CHATSMESSAGES.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  pipeline.push({ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize });

  pipeline.push({
    $project: {
      _id: 0,
      userId: '$_id',
      lastMessage: 1,
      unreadCount: 1,
      'user._id': 1,
      'user.fullName': 1,
      'user.profileImageUrl': 1,
      'user.locationString': 1,
      'user.otherLanguages': 1,
      'user.isOnline': 1,
      'user.lastActive': 1,
    },
  });

  const chats = await CHATSMESSAGES.aggregate(pipeline);

  return {
    chats,
    totalCount,
    hasNext: pageNumber * pageSize < totalCount,
  };
};

const markMessagesAsRead = async (hostId: string, userId: string) => {
  const ObjectId = require('mongoose').Types.ObjectId;
  await CHATSMESSAGES.updateMany({ senderId: new ObjectId(userId), receiverId: new ObjectId(hostId), isRead: false }, { $set: { isRead: true } });
};

const getChatsByHost = async (employeeId: string, hostId: string) => {
  return CHATSMESSAGES.find({ employeeId, hostId }).sort({ lastUpdated: -1 }).select('hostId employeeId lastMessage lastUpdated messages').lean();
};

const getHostRecentChatsListEmployee = async (
  hostId: Types.ObjectId | string,
  filters: { locationString?: string; otherLanguages?: string[] },
  pageNumber: number,
  pageSize: number,
) => {
  const hostObjectId = typeof hostId === 'string' ? new Types.ObjectId(hostId) : hostId;

  const pipeline: any[] = [
    {
      $match: {
        documentStatus: true,
        $or: [{ senderId: hostObjectId }, { receiverId: hostObjectId }],
      },
    },
    { $sort: { sentAt: -1 } },
    {
      $addFields: {
        userId: { $cond: [{ $eq: ['$senderId', hostObjectId] }, '$receiverId', '$senderId'] },
      },
    },
    {
      $group: {
        _id: '$userId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$receiverId', hostObjectId] }, { $eq: ['$isRead', false] }] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'cln_users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  const userFilters: any = {};
  if (filters.locationString) {
    userFilters['user.locationString'] = { $regex: filters.locationString, $options: 'i' };
  }
  if (filters.otherLanguages?.length) userFilters['user.otherLanguages'] = { $in: filters.otherLanguages };
  if (Object.keys(userFilters).length) pipeline.push({ $match: userFilters });

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await CHATSMESSAGES.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  pipeline.push({ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize });

  pipeline.push({
    $project: {
      _id: 0,
      userId: '$_id',
      lastMessage: 1,
      unreadCount: 1,
      'user._id': 1,
      'user.fullName': 1,
      'user.profileImageUrl': 1,
      'user.locationString': 1,
      'user.otherLanguages': 1,
      'user.isOnline': 1,
      'user.lastActive': 1,
    },
  });

  const chats = await CHATSMESSAGES.aggregate(pipeline);

  return {
    chats,
    totalCount,
    hasNext: pageNumber * pageSize < totalCount,
  };
};

export default { getHostRecentChats, getHostRecentChatsList, markMessagesAsRead, getChatsByHost, getHostRecentChatsListEmployee };
