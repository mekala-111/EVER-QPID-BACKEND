import MatchingEntity from '../entities/matchingEntity';
import { paginate } from '../helper/paginationHelper';
import MATCHING from '../models/matching/matching';
import { IMatching } from '../models/matching/matching-model';
import USER from '../models/user/user';
import { IUser } from '../models/user/user-model';
import { Types } from 'mongoose';
import { PaginatedResult, PaginationInput } from '../types/common';
import userRepository from './user-repository';
import { validateBadRequest } from '../utils/validators';

const calculateAge = (dob?: Date): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

/**
 * Fetch a match by its ID.
 * @param {string} id - The ID of the match.
 * @returns {Promise<IMatching | null>} A matching document or null.
 */
const getById = async (id: string): Promise<IMatching | null> => {
  return await MATCHING.findById(id).exec();
};

/**
 * Create a new match entry.
 * @param {MatchingEntity} matchData - The data to create the match with.
 * @returns {Promise<IMatching>} The created matching document.
 */
const create = async (matchData: MatchingEntity): Promise<IMatching> => {
  const newMatch = new MATCHING(matchData);
  return await newMatch.save();
};

/**
 * delete a new match entry.
 * @param {MatchingEntity} matchData - The data to create the match with.
 * @returns {Promise<IMatching>} The created matching document.
 */
const deleteMatch = async (fromUserId: string, toUserId: string): Promise<void> => {
  await MATCHING.deleteOne({
    $or: [{ fromUserId, toUserId }],
  }).exec();
};

/**
 * Get a match between two specific users.
 * @param {string} fromUserId - The user who initiated the match.
 * @param {string} toUserId - The user who was matched with.
 * @returns {Promise<IMatching | null>} The match document if exists.
 */
const getMatchByUsers = async (fromUserId: string, toUserId: string): Promise<IMatching | null> => {
  return await MATCHING.findOne({ fromUserId, toUserId }).populate('fromUserId', '_id name').populate('toUserId', '_id name').exec();
};

/**
 * Get all matches for a specific user (involved as fromUser or toUser).
 * @param {string} userId - The user ID to fetch matches for.
 * @param {PaginationInput} pagination - Pagination config.
 * @returns {Promise<PaginatedResult<IMatching>>} Paginated result of matches.
 */
const getMatchesForUser = async (userId: string, pagination: PaginationInput): Promise<PaginatedResult<any>> => {
  const { pageNumber, pageSize } = pagination;

  const allLikes = await MATCHING.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  }).lean();

  const mutualUserIds: string[] = [];

  for (const like of allLikes) {
    const from = like.fromUserId.toString();
    const to = like.toUserId.toString();

    const otherUserId = from === userId ? to : from;

    const reverseExists = await MATCHING.exists({
      fromUserId: otherUserId,
      toUserId: userId,
    });

    if (reverseExists) {
      mutualUserIds.push(otherUserId);
    }
  }

  const uniqueMutualIds = [...new Set(mutualUserIds)];

  const totalCount = uniqueMutualIds.length;

  const paginatedIds = uniqueMutualIds.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  const users = await USER.find({ _id: { $in: paginatedIds } })
    .select('fullName profileImageUrl gender dateOfBirth locationString')
    .lean();

  return { data: users, totalCount, hasNext: pageNumber * pageSize < totalCount };
};

/**
 * Get profiles a user has liked (paginated)
 * @param {string} userId - The user who liked others
 * @param {{ pageNumber: number; pageSize: number }} pagination
 * @returns {Promise<{ likedProfiles: IUser[], totalCount: number, hasNext: boolean }>}
 */

const getLikedProfiles = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
  filter: any,
): Promise<{ likedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  const { minAge, maxAge, allowOutOfAgeRange, allowOutOfDistance, maxDistance, languages, minPhotos, hasBio, ...restFilters } = filter;

  const user = await userRepository.findUserById(new Types.ObjectId(userId));
  if (!user) throw new Error('User not found');

  const userMatchFilters: any = { documentStatus: true };

  if (minPhotos !== undefined) {
    userMatchFilters.$expr = {
      $gte: [{ $size: { $ifNull: ['$profileImageUrl', []] } }, minPhotos],
    };
  }

  if (hasBio) {
    userMatchFilters.bio = { $ne: '' };
  }

  if (languages?.length) {
    userMatchFilters.languages = { $in: languages };
  }

  if (minAge && maxAge) {
    const today = new Date();
    const ageOffset = allowOutOfAgeRange ? 2 : 0;

    const maxDob = new Date(today.getFullYear() - (minAge - ageOffset), today.getMonth(), today.getDate() + 1);
    const minDob = new Date(today.getFullYear() - (maxAge + ageOffset) - 1, today.getMonth(), today.getDate() + 1);

    userMatchFilters.dob = {
      $gte: minDob,
      $lt: maxDob,
    };
  }

  Object.entries(restFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      userMatchFilters[key] = Array.isArray(value) && value.length > 0 ? { $in: value } : value;
    }
  });

  const page = pagination.pageNumber;
  const limit = pagination.pageSize;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [];

  if (user.lat !== undefined && user.lng !== undefined && maxDistance !== undefined && !allowOutOfDistance) {
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [user.lng, user.lat] },
        distanceField: 'distance',
        spherical: true,
        maxDistance: maxDistance * 1000,
        query: userMatchFilters,
      },
    });
  } else {
    pipeline.push({ $match: userMatchFilters });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'cln_matchings',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$fromUserId', new Types.ObjectId(userId)] }, { $eq: ['$toUserId', '$$userId'] }, { $eq: ['$documentStatus', true] }],
              },
            },
          },
        ],
        as: 'likeData',
      },
    },
    {
      $match: {
        likeData: { $ne: [] },
      },
    },
    { $skip: skip },
    { $limit: limit },
  );

  const res = await MATCHING.find({ fromUserId: new Types.ObjectId(userId) });
  console.log(res);

  const [totalResult, likedProfiles] = await Promise.all([USER.aggregate([...pipeline, { $count: 'count' }]), USER.aggregate(pipeline)]);

  const totalCount = totalResult[0]?.count || 0;
  const hasNext = totalCount > page * limit;

  const usersWithAge = likedProfiles.map((user) => ({
    ...user,
    age: calculateAge(user.dateOfBirth),
  }));

  return { likedProfiles: usersWithAge, totalCount, hasNext };
};

/**
 * Get profiles that *liked the user* (received likes)
 * @param {string} userId - The user who was liked by others
 * @param {{ pageNumber: number; pageSize: number }} pagination
 * @returns {Promise<{ receivedProfiles: IUser[], totalCount: number, hasNext: boolean }>}
 */
const getReceivedLikes = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
  filters: any,
): Promise<{ receivedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  const { minAge, maxAge, allowOutOfAgeRange, allowOutOfDistance, maxDistance, languages, minPhotos, hasBio, ...restFilters } = filters;

  const user = await userRepository.findUserById(new Types.ObjectId(userId));
  if (!user) throw new Error('User not found');

  const userMatchFilters: any = {
    documentStatus: true,
  };

  if (minPhotos !== undefined) {
    userMatchFilters.$expr = {
      $gte: [{ $size: { $ifNull: ['$profileImageUrl', []] } }, minPhotos],
    };
  }

  if (hasBio) {
    userMatchFilters.bio = { $ne: '' };
  }

  if (languages?.length) {
    userMatchFilters.languages = { $in: languages };
  }

  if (minAge && maxAge) {
    const today = new Date();

    const ageOffset = allowOutOfAgeRange ? 2 : 0;

    const maxDob = new Date(today.getFullYear() - (minAge - ageOffset), today.getMonth(), today.getDate() + 1);
    const minDob = new Date(today.getFullYear() - (maxAge + ageOffset) - 1, today.getMonth(), today.getDate() + 1);

    userMatchFilters.dob = {
      $gte: minDob,
      $lt: maxDob,
    };
  }

  Object.entries(restFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      userMatchFilters[key] = Array.isArray(value) && value.length > 0 ? { $in: value } : value;
    }
  });

  const page = pagination.pageNumber;
  const limit = pagination.pageSize;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [];

  if (user.lat !== undefined && user.lng !== undefined && maxDistance !== undefined && !allowOutOfDistance) {
    console.log('here');

    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [user.lng, user.lat] },
        distanceField: 'distance',
        spherical: true,
        maxDistance: maxDistance * 1000,
        query: userMatchFilters,
      },
    });
  } else {
    pipeline.push({ $match: userMatchFilters });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'cln_matchings',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$toUserId', new Types.ObjectId(userId)] }, { $eq: ['$fromUserId', '$$userId'] }, { $eq: ['$documentStatus', true] }],
              },
            },
          },
        ],
        as: 'likeData',
      },
    },
    {
      $match: {
        likeData: { $ne: [] },
      },
    },
    // ✅ NEW: get createdAt from matching
  {
    $addFields: {
      likedAt: {
        $arrayElemAt: ["$likeData.createdAt", 0],
      },
    },
  },

  // ✅ NEW: sort by like time
  {
    $sort: {
      likedAt: -1,
    },
  },
    {
      $lookup: {
        from: 'cln_matchings',
        let: { toUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$fromUserId', new Types.ObjectId(userId)] },
                  { $eq: ['$toUserId', '$$toUserId'] },
                  { $eq: ['$documentStatus', true] },
                ],
              },
            },
          },
        ],
        as: 'likedBackData',
      },
    },
    {
      $addFields: {
        isLiked: { $gt: [{ $size: '$likedBackData' }, 0] },
      },
    },
    {
      $project: {
        likedBackData: 0,
        likeData: 0,
      },
    },
    
  );

  const [totalResult, receivedProfiles] = await Promise.all([USER.aggregate([...pipeline, { $count: 'count' }]), USER.aggregate([...pipeline, { $skip: skip }, { $limit: limit }])]);
  const totalCount = totalResult[0]?.count || 0;
  const hasNext = totalCount > page * limit;
 
  const usersWithAge = receivedProfiles.map((user) => ({
    ...user,
    age: calculateAge(user.dateOfBirth),
  }));

  return { receivedProfiles: usersWithAge, totalCount, hasNext };
};

/**
 * find mutual matches
 * @param {string} userId
 * @param {{pageNumber: number; pageSize: number}} pagination
 * @returns {Promise<{matchedProfiles: IUser[], totalCount: number, hasNext: boolean}>}
 */
const getMutualMatches = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
): Promise<{ matchedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  const userObjectId = new Types.ObjectId(userId);

  // Step 1: Users I liked
  const userLikes = await MATCHING.find({
    fromUserId: userObjectId,
    documentStatus: true,
  }).select('toUserId');

  const likedUserIds = userLikes.map((match) => match.toUserId);

  if (likedUserIds.length === 0) {
    return { matchedProfiles: [], totalCount: 0, hasNext: false };
  }

  // Step 2: Find mutual likes (sorted by createdAt DESC)
  const mutualLikesQuery = {
    toUserId: userObjectId,
    documentStatus: true,
    fromUserId: { $in: likedUserIds },
  };

  const totalCount = await MATCHING.countDocuments(mutualLikesQuery);

  const mutualLikes = await MATCHING.find(mutualLikesQuery)
    .sort({ createdAt: -1 }) // ✅ newest match first
    .skip((pagination.pageNumber - 1) * pagination.pageSize)
    .limit(pagination.pageSize)
    .select('fromUserId createdAt')
    .lean();

  const mutualMatchIds = mutualLikes.map((match) => match.fromUserId);

  if (mutualMatchIds.length === 0) {
    return { matchedProfiles: [], totalCount, hasNext: false };
  }

  // Step 3: Fetch user profiles
  const matchedUsers = await USER.find({
    _id: { $in: mutualMatchIds },
    // documentStatus: true,
  }).lean();

  // Step 4: Preserve order from MATCHING.createdAt
  const userMap = new Map(
    matchedUsers.map((user) => [user._id.toString(), user]),
  );

  const orderedUsers = mutualMatchIds
    .map((id) => userMap.get(id.toString()))
    .filter(Boolean);

  const usersWithAge = orderedUsers.map((user: any) => ({
    ...user,
    age: calculateAge(user.dateOfBirth),
  }));

  const hasNext = totalCount > pagination.pageNumber * pagination.pageSize;

  return {
    matchedProfiles: usersWithAge,
    totalCount,
    hasNext,
  };
};

/**
 * Get all matches (admin view).
 * @param {PaginationInput} pagination - Pagination config.
 * @returns {Promise<PaginatedResult<IMatching>>} Paginated result of all matches.
 */
const getAllMatches = async (pagination: PaginationInput): Promise<PaginatedResult<IMatching>> => {
  const { data, totalCount, hasNext } = await paginate(MATCHING, pagination);
  return { data, totalCount, hasNext };
};

/**
 * Get matches for a specific user (admin view).
 * @param {string} userId - User ID to fetch matches for.
 * @param {PaginationInput} pagination - Pagination config.
 * @returns {Promise<PaginatedResult<IMatching>>} Paginated result of matches.
 */
const getMatchesForUserAdmin = async (userId: string, pagination: PaginationInput): Promise<PaginatedResult<IMatching>> => {
  return await getMatchesForUser(userId, pagination);
};

/**
 * Get total number of matches in the system.
 * @returns {Promise<number>} The total match count.
 */
const getTotalMatches = async (): Promise<number> => {
  return await MATCHING.countDocuments();
};

/**
 * Get the average match rate (placeholder logic).
 * @returns {Promise<number>} Average match percentage.
 */
const getAverageMatchRate = async (): Promise<number> => {
  const total = await MATCHING.countDocuments();
  const totalUsers = 1000;
  return totalUsers > 0 ? Math.round((total / totalUsers) * 10000) / 100 : 0;
};

/**
 * Get a match between two specific users.
 * @param {string} fromUserId - The user who initiated the match.
 * @param {string} toUserId - The user who was matched with.
 * @returns {Promise<IMatching | null>} The match document if exists.
 */
const findMutualMatch = async (fromUserId: string, toUserId: string): Promise<boolean> => {
  const fromId = new Types.ObjectId(fromUserId);
  const toId = new Types.ObjectId(toUserId);

  const matches = await MATCHING.find({
    $or: [
      { fromUserId: fromId, toUserId: toId },
      { fromUserId: toId, toUserId: fromId },
    ],
  })
    .select('fromUserId toUserId')
    .lean();

  const hasForward = matches.some((m) => m.fromUserId.toString() === fromUserId && m.toUserId.toString() === toUserId);
  const hasReverse = matches.some((m) => m.fromUserId.toString() === toUserId && m.toUserId.toString() === fromUserId);

  return hasForward && hasReverse;
};

const getMutualMatchesByAdmin = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
): Promise<{ matchedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  const userObjectId = new Types.ObjectId(userId);

  const userLikes = await MATCHING.find({
    fromUserId: userObjectId,
    documentStatus: true,
  }).select('toUserId');

  const likedUserIds = userLikes.map((match) => match.toUserId);

  const mutualLikes = await MATCHING.find({
    toUserId: userObjectId,
    documentStatus: true,
    fromUserId: { $in: likedUserIds },
  }).select('fromUserId');

  const mutualMatchIds = mutualLikes.map((match) => match.fromUserId);

  const matchedProfiles = await USER.find({ _id: { $in: mutualMatchIds } }, 'fullName gender updatedAt')
    .skip((pagination.pageNumber - 1) * pagination.pageSize)
    .limit(pagination.pageSize);

  const totalCount = mutualMatchIds.length;
  const hasNext = totalCount > pagination.pageNumber * pagination.pageSize;

  return { matchedProfiles, totalCount, hasNext };
};

const getMutualMatchIds = async (userId: Types.ObjectId) => {
  const userLikes = await MATCHING.find({
    fromUserId: userId,
    documentStatus: true,
  }).select('toUserId');

  const likedUserIds = userLikes.map((m) => m.toUserId);

  const mutual = await MATCHING.find({
    toUserId: userId,
    documentStatus: true,
    fromUserId: { $in: likedUserIds },
  }).select('fromUserId');

  return mutual.map((m) => m.fromUserId.toString());
};

const countLikesToday = async (fromUserId: string): Promise<number> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await MATCHING.aggregate([
    { $match: { fromUserId: new Types.ObjectId(fromUserId), createdAt: { $gte: startOfDay } } },
    { $group: { _id: '$toUserId' } },
    { $count: 'uniqueCount' },
  ]);

  return result[0]?.uniqueCount || 0;
};

const countSuperLikesToday = async (fromUserId: string): Promise<number> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await MATCHING.aggregate([
    { $match: { fromUserId: new Types.ObjectId(fromUserId), createdAt: { $gte: startOfDay } } },
    { $group: { _id: '$toUserId' } },
    { $count: 'uniqueCount' },
  ]);

  return result[0]?.uniqueCount || 0;
};

const getReceivedLikesHost = async (employeeId: string) => {
  const host = await USER.findOne({ employeeId }).select('_id');

  if (!host) {
    throw validateBadRequest(true, 'Host not found');
  }

  return MATCHING.find({ toUserId: host._id }).populate('fromUserId', '_id fullName profileImageUrl gender').sort({ createdAt: -1 }).lean();
};

// const getReceivedLikesByHostId = async (hostId: string) => {
//   const likes = await MATCHING.find({ toUserId: hostId })
//     .populate('fromUserId', '_id fullName profileImageUrl dateOfBirth')
//     .sort({ createdAt: -1 })
//     .lean();

//   return likes.map((like: any) => ({
//     ...like,
//     fromUserId: {
//       ...like.fromUserId,
//       age: like.fromUserId?.dateOfBirth ? calculateAge(like.fromUserId.dateOfBirth) : null,
//     },
//   }));
// };

const getReceivedLikesByHostId = async (hostId: string) => {
  const likes = await MATCHING.find({ toUserId: hostId })
    .populate('fromUserId', '_id fullName profileImageUrl dateOfBirth')
    .sort({ createdAt: -1 })
    .lean();

  const senderIds = likes.map((like: any) => like.fromUserId?._id);

  const reverseLikes = await MATCHING.find({
    fromUserId: hostId,
    toUserId: { $in: senderIds },
  })
    .select('toUserId')
    .lean();

  const reverseLikeMap = new Set(reverseLikes.map((like: any) => like.toUserId.toString()));

  return likes.map((like: any) => ({
    ...like,
    isLikedBack: reverseLikeMap.has(like.fromUserId._id.toString()),
    fromUserId: {
      ...like.fromUserId,
      age: like.fromUserId?.dateOfBirth ? calculateAge(like.fromUserId.dateOfBirth) : null,
    },
  }));
};

export default {
  getById,
  create,
  deleteMatch,
  getMatchByUsers,
  getMatchesForUser,
  getLikedProfiles,
  getMutualMatches,
  getAllMatches,
  getMatchesForUserAdmin,
  getTotalMatches,
  getAverageMatchRate,
  getReceivedLikes,
  findMutualMatch,
  getMutualMatchesByAdmin,
  getMutualMatchIds,
  countLikesToday,
  countSuperLikesToday,
  getReceivedLikesHost,
  getReceivedLikesByHostId,
};
