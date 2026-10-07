import config from '../config/config';
import MatchingEntity from '../entities/matchingEntity';
import ERROR from '../middlewares/web_server/http-error';
import { IMatching } from '../models/matching/matching-model';
import RECENT_PASS_USERS from '../models/recent-pass-users/recent-pass-users';
import USER from '../models/user/user';
import { IUser } from '../models/user/user-model';
import { matchingRepository, userRepository } from '../repositories';
import { sendLikeNotification, sendMatchNotification } from '../utils/sendNotification';
import { validateRequiredField, validateUserAuthorization, validateBadRequest, validateDocumentExists, validateNotFound } from '../utils/validators';
import chatMessageService from './chatMessage-service';

/**
 * Like a profile and create a potential match between users
 * @param {string} fromUserId - The user who is liking
 * @param {string} toUserId - The user being liked
 * @returns {Promise<IMatching>}
 */

const createMatch = async (fromUserId: string, toUserId: string): Promise<IMatching> => {
  validateUserAuthorization(fromUserId);
  validateRequiredField(toUserId, 'toUserId');

  if (fromUserId === toUserId) {
    throw validateBadRequest(true, 'You cannot like your own profile');
  }

  const user = await userRepository.getUserBasicInfo(fromUserId);

  const isWoman = user?.gender === 'Women';

  if (!isWoman) {
    const subscriptionStatus = await userRepository.getSubscriptionStatus(fromUserId);

    if (subscriptionStatus !== 'Active') {
      const todaysLikes = await matchingRepository.countSuperLikesToday(fromUserId);

      if (todaysLikes >= config.likes.freeLimitPerDay) {
        validateBadRequest(true, 'Please subscribe to continue liking');
      }
    }
  }

  const existingLike = await matchingRepository.getMatchByUsers(fromUserId, toUserId);
  if (existingLike) {
    throw validateBadRequest(true, 'This profile is already liked');
  }

  const matchEntity = new MatchingEntity(true, fromUserId, toUserId, fromUserId, new Date(), null, new Date());

  const createdLike = await matchingRepository.create(matchEntity);

  await RECENT_PASS_USERS.deleteOne({ userId: fromUserId, recentPassUser: toUserId });

  //const targetUser = await USER.findById(toUserId).select('isHostProfile fullName');

  // if (targetUser?.isHostProfile) {
  //   const reverseExists = await matchingRepository.getMatchByUsers(toUserId, fromUserId);

  //   if (!reverseExists) {
  //     const autoMatch = new MatchingEntity(true, toUserId, fromUserId, toUserId, new Date(), null, new Date());
  //     await matchingRepository.create(autoMatch);
  //   }
  // }

  await sendLikeNotification(toUserId, fromUserId);

  const reverseExists = await matchingRepository.getMatchByUsers(toUserId, fromUserId);

  if (reverseExists) {
    await sendMatchNotification(fromUserId, toUserId);
  }

  const cleanMatch = {
    ...createdLike.toObject(),
    fromUserId: createdLike.fromUserId.toString(),
    toUserId: createdLike.toUserId.toString(),
  };
  return cleanMatch;
};

/**
 * ubnLike a profile
 * @param {string} fromUserId -
 * @param {string} toUserId
 * @returns {Promise<IMatching>}
 */
const removeMatch = async (fromUserId: string, toUserId: string): Promise<void> => {
  validateUserAuthorization(fromUserId);
  validateRequiredField(toUserId, 'toUserId');

  validateBadRequest(fromUserId === toUserId, 'You cannot unlike your own profile');

  const existingMatch = await matchingRepository.getMatchByUsers(fromUserId, toUserId);
  validateDocumentExists(!existingMatch, 'No existing match found between these users');
  await chatMessageService.deleteAllMessages(fromUserId, toUserId);
  await matchingRepository.deleteMatch(fromUserId, toUserId);
};

/**
 * Service: Get all mutual matches for a user
 * @param {string} userId - The user whose matches are being fetched
 * @param {{pageNumber: number; pageSize: number}} pagination - Pagination details
 * @returns {Promise<{matchedProfiles: IUser[], totalCount: number, hasNext: boolean}>}
 */
const getMutualMatches = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
): Promise<{ matchedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  validateUserAuthorization(userId);
  return await matchingRepository.getMutualMatches(userId, pagination);
};

/**
 * Get all profiles that a user liked (paginated)
 * @param {string} userId - The user whose liked profiles are being fetched
 * @param {{ pageNumber: number; pageSize: number }} pagination
 * @returns {Promise<{ likedProfiles: IUser[]; totalCount: number; hasNext: boolean }>}
 */
const getUserLikedProfiles = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
  filters: any,
): Promise<{ likedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  validateUserAuthorization(userId);
  const { likedProfiles, totalCount, hasNext } = await matchingRepository.getLikedProfiles(userId, pagination, filters);
  return { likedProfiles, totalCount, hasNext };
};

/**
 * Get all profiles that a user liked (paginated)
 * @param {string} userId - The user whose liked profiles are being fetched
 * @param {{ pageNumber: number; pageSize: number }} pagination
 * @returns {Promise<{ receivedProfiles: IUser[]; totalCount: number; hasNext: boolean }>}
 */
const getReceivedLikes = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
  filters: any,
): Promise<{ receivedProfiles: IUser[]; totalCount: number; hasNext: boolean; isSubscribed: boolean }> => {
  validateUserAuthorization(userId);

  const user = await USER.findById(userId).select('subscribedPlanStatus gender');

  if (!user) {
    throw new Error('User not found');
  }

  const isSubscribed = user.gender === 'Women' ? true : user.subscribedPlanStatus === 'Active';

  const { receivedProfiles, totalCount, hasNext } = await matchingRepository.getReceivedLikes(userId, pagination, filters);

  if (totalCount === 0) {
    throw validateBadRequest(true, 'You have not received any likes yet');
  }
  return { receivedProfiles, totalCount, hasNext, isSubscribed };
};

/**
 * Get all matches across the platform (Admin only)
 * @param {{pageNumber: number; pageSize: number}} pagination - Pagination details
 * @returns {Promise<{matches: IMatching[], totalCount: number, hasNext: boolean}>}
 */
const getAllMatches = async (pagination: {
  pageNumber: number;
  pageSize: number;
}): Promise<{ data: IMatching[]; totalCount: number; hasNext: boolean }> => {
  const { data, totalCount, hasNext } = await matchingRepository.getAllMatches(pagination);
  return { data, totalCount, hasNext };
};

/**
 * Get matches for a specific user (Admin only)
 * @param {string} userId - The user whose matches are being fetched
 * @param {{pageNumber: number; pageSize: number}} pagination - Pagination details
 * @returns {Promise<{matches: IMatching[], totalCount: number, hasNext: boolean}>}
 */
const getUserMatchesAdmin = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
): Promise<{ data: IMatching[]; totalCount: number; hasNext: boolean }> => {
  validateRequiredField(userId, 'userId');

  return await matchingRepository.getMatchesForUserAdmin(userId, pagination);
};

/**
 * Get match statistics (Admin only)
 * @returns {Promise<{ totalMatches: number, averageMatchRate: number }>}
 */
const getMatchStats = async (): Promise<{ totalMatches: number; averageMatchRate: number }> => {
  const totalMatches = await matchingRepository.getTotalMatches();
  const averageMatchRate = await matchingRepository.getAverageMatchRate();

  return { totalMatches, averageMatchRate };
};

/**
 * Find favorite
 * @param {string} blockedBy
 * @param {string} blockedAccountId
 * @returns {Promise<IBlock | null>}
 */
const findMutualMatch = async (userId: string, favProfileId: string): Promise<boolean> => {
  return await matchingRepository.findMutualMatch(userId, favProfileId);
};

const getMutualMatchesByAdmin = async (
  userId: string,
  pagination: { pageNumber: number; pageSize: number },
): Promise<{ matchedProfiles: IUser[]; totalCount: number; hasNext: boolean }> => {
  validateUserAuthorization(userId);
  return await matchingRepository.getMutualMatchesByAdmin(userId, pagination);
};

const createSuperLikeMatch = async (fromUserId: string, toUserId: string): Promise<IMatching> => {
  validateUserAuthorization(fromUserId);
  validateRequiredField(toUserId, 'toUserId');

  if (fromUserId === toUserId) {
    throw validateBadRequest(true, 'You cannot super like your own profile');
  }

  const user = await userRepository.getUserBasicInfo(fromUserId);

  const isWoman = user?.gender === 'Women';

  if (!isWoman) {
    const subscriptionStatus = await userRepository.getSubscriptionStatus(fromUserId);

    if (subscriptionStatus !== 'Active') {
      throw validateBadRequest(true, 'Please subscribe to send super likes');
    }

    const superLikeLimit = Number(config.superLikes.freeSuperLikelimitPerDay);

    const todaysSuperLikes = await matchingRepository.countSuperLikesToday(fromUserId);

    if (todaysSuperLikes >= superLikeLimit) {
      throw validateBadRequest(true, 'Super like limit reached for today');
    }
  }

  const existingLike = await matchingRepository.getMatchByUsers(fromUserId, toUserId);
  if (existingLike) {
    throw validateBadRequest(true, 'This profile is already super liked');
  }

  const matchEntity = new MatchingEntity(true, fromUserId, toUserId, fromUserId, new Date(), null, new Date());

  const createdMatch = await matchingRepository.create(matchEntity);

  await sendMatchNotification(fromUserId, toUserId);
  return {
    ...createdMatch.toObject(),
    fromUserId: createdMatch.fromUserId.toString(),
    toUserId: createdMatch.toUserId.toString(),
  };
};

const getReceivedLikesForHost = async (employeeId: string, hostId: string) => {
  if (!employeeId) {
    throw new ERROR.BadRequestError('Unauthorized');
  }

  if (!hostId) {
    throw new ERROR.BadRequestError('Host ID is required');
  }

  const host = await userRepository.getHostByIdAndEmployee(hostId, employeeId);

  validateNotFound(host, 'Host not found or not assigned to this employee');

  return await matchingRepository.getReceivedLikesByHostId(hostId);
};

const likeBackFromHost = async (employeeId: string, hostId: string, toUserId: string) => {
  if (!employeeId) {
    throw new ERROR.BadRequestError('Unauthorized');
  }

  if (!hostId) {
    throw new ERROR.BadRequestError('Host ID is required');
  }

  if (!toUserId) {
    throw new ERROR.BadRequestError('Target user ID is required');
  }

  const host = await userRepository.getHostByIdAndEmployee(hostId, employeeId);
  validateNotFound(host, 'Host not found or not assigned to this employee');

  const existingLike = await matchingRepository.getMatchByUsers(hostId, toUserId);

  let createdLike;

  if (!existingLike) {
    const matchEntity = new MatchingEntity(true, hostId, toUserId, hostId, new Date(), null, new Date());

    createdLike = await matchingRepository.create(matchEntity);
  } else {
    createdLike = existingLike;
  }

  const reverseExists = await matchingRepository.getMatchByUsers(toUserId, hostId);

  const isMatched = !!reverseExists;

  if (isMatched) {
    await sendMatchNotification(hostId, toUserId);
  }

  return {
    ...(createdLike.toObject?.() ?? createdLike),
    fromUserId: hostId,
    toUserId,
    matchStatus: isMatched ? 'MATCHED' : 'LIKED',
  };
};

export default {
  createMatch,
  removeMatch,
  getMutualMatches,
  getUserLikedProfiles,
  getAllMatches,
  getUserMatchesAdmin,
  getMatchStats,
  getReceivedLikes,
  findMutualMatch,
  getMutualMatchesByAdmin,
  createSuperLikeMatch,
  getReceivedLikesForHost,
  likeBackFromHost,
};
