import RecentPassUsersEntity from '../entities/recent-pass-users';
import ERROR from '../middlewares/web_server/http-error';
import CHATSMESSAGES from '../models/chatMessage/chatMessage';
import MATCHING from '../models/matching/matching';
import { IRecentPassUsers } from '../models/recent-pass-users/recent-pass-users-model';
import SUPPORT from '../models/support/support';
import TRANSACTION from '../models/transaction/transaction';
import { IUserSearchFilter } from '../models/user-search-filter/user-search-filter-model';
import USER from '../models/user/user';
import { IUser } from '../models/user/user-model';
import { profileRepository, userRepository } from '../repositories';
import {
  validateBadRequest,
  validateDocumentExists,
  validateNotFound,
  validateRequiredField,
  validateUserAuthorization,
  validateUserExists,
} from '../utils/validators';
import { Types } from 'mongoose';
/**
 * Get a user profile
 * @param {string} userId
 * @returns {Promise<IUser | null>}
 */
const getUserProfile = async (userId: string): Promise<IUser | null> => {
  validateUserAuthorization(userId);
  const userProfile = await profileRepository.getById(userId);
  validateNotFound(userProfile, 'userProfile');

  return userProfile;
};

/**
 * Update a user profile
 * @param {string} userId
 * @param {Partial<IUser>} updateData
 * @returns {Promise<IUser | null>}
 */
const updateProfile = async (userId: string, updateData: Partial<IUser>): Promise<IUser | null> => {
  validateUserAuthorization(userId);
  const existingUser = await profileRepository.getById(userId);
  validateNotFound(existingUser, 'existingUser');
  const existingUserName = await profileRepository.findUserNameAlredyExists(updateData.fullName, userId);
  validateUserExists(existingUserName);
  const existingMobileNumber = await profileRepository.findMobileNumberAlreadyExists(updateData.mobileNumber, userId);
  validateDocumentExists(existingMobileNumber, 'mobileNumber');
  const updatedProfile = await profileRepository.update(userId, updateData);
  validateNotFound(updatedProfile, 'updatedProfile');
  return updatedProfile;
};

/**
 * Get all user profiles with pagination and optional filters
 * @param {string} adminId
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @param {Date} options.startDate
 * @param {Date} options.endDate
 * @returns {Promise<{ users: IUser[], hasNext: boolean, totalCount: number }>}
 */
const getAllUsers = async (
  userId: string,
  {
    pageNumber,
    pageSize,
    searchTag,
    startDate,
    endDate,
    gender,
    language,
    country,
    state,
    interest,
    category,
    sortBy,
  }: {
    pageNumber: number;
    pageSize: number;
    searchTag: string;
    startDate?: Date;
    endDate?: Date;
    gender?: string;
    language?: string;
    country?: string;
    state?: string;
    interest?: string[];
    category?: string[];
    sortBy?: string;
  },
): Promise<{ users: IUser[]; totalCount: number; hasNext: boolean }> => {
  validateUserAuthorization(userId);

  const { users, totalCount, hasNext } = await profileRepository.getAllUsers({
    userId,
    pageNumber,
    pageSize,
    searchTag,
    startDate,
    endDate,
    gender,
    language,
    country,
    state,
    interest,
    category,
    sortBy,
  });

  return { users, totalCount, hasNext };
};
/**
 * Get a user profile
 * @param {string} adminId
 *  @param {string} userId
 * @returns {Promise<IUser | null>}
 */

const getProfileDetails = async (adminId: string, userId: string): Promise<any> => {
  validateUserAuthorization(adminId);
  validateRequiredField(userId, 'userId');

  const userProfile = await USER.findById(userId).lean().exec();
  validateNotFound(userProfile, 'userProfile');

  (userProfile as any).lastActive = userProfile.lastActive || userProfile.createdAt;

  const totalMatchesAgg = await MATCHING.aggregate([
    {
      $match: {
        documentStatus: true,
        $or: [{ fromUserId: new Types.ObjectId(userId) }, { toUserId: new Types.ObjectId(userId) }],
      },
    },
    {
      $project: {
        otherUserId: {
          $cond: [{ $eq: ['$fromUserId', new Types.ObjectId(userId)] }, '$toUserId', '$fromUserId'],
        },
        fromUserId: 1,
        toUserId: 1,
      },
    },
    {
      $lookup: {
        from: 'cln_matchings',
        let: { otherUserId: '$otherUserId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$fromUserId', '$$otherUserId'] },
                  { $eq: ['$toUserId', new Types.ObjectId(userId)] },
                  { $eq: ['$documentStatus', true] },
                ],
              },
            },
          },
        ],
        as: 'reverseLike',
      },
    },
    {
      $match: {
        reverseLike: { $ne: [] },
      },
    },
    {
      $group: {
        _id: '$otherUserId',
      },
    },
    {
      $count: 'totalMatches',
    },
  ]);

  const totalMatches = totalMatchesAgg[0]?.totalMatches || 0;

  const totalSpendAgg = await TRANSACTION.aggregate([
    { $match: { userId: new Types.ObjectId(userId), status: 'Success' } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
  ]);
  const totalSpend = totalSpendAgg[0]?.totalAmount || 0;

  const lastChat = await CHATSMESSAGES.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
    documentStatus: true,
  })
    .sort({ sentAt: -1 })
    .limit(1);

  const openTickets = await SUPPORT.countDocuments({
    userId: userId,
    status: 'open',
    documentStatus: true,
  });

  const isSubscribed = userProfile.subscribedPlanStatus === 'Active';

  const sideProfileDetails = {
    fullName: userProfile.fullName,
    joinedDate: userProfile.createdAt,
    lastActive: userProfile.lastActive || userProfile.createdAt,
    phoneNo: userProfile.mobileNumber,
    email: userProfile.email,
    isVerified: userProfile.isVerified,
    isSubscribed,
    totalMatches,
    totalSpend,
    openTickets,
    lastChatOn: lastChat[0]?.sentAt || null,
  };

  return { userProfile, sideProfileDetails };
};

const uploadImages = async (imageUrls: string[], userId: string): Promise<IUser | null> => {
  validateUserAuthorization(userId);
  const updatedUser = await profileRepository.uploadImages(imageUrls, userId);

  return updatedUser;
};

const changeBusy = async (userId: string, isBusy: boolean): Promise<boolean> => {
  validateUserAuthorization(userId);

  const user: any = await profileRepository.getById(userId);
  validateNotFound(user, 'user');

  user.isBusy = isBusy;
  await user.save();

  return user.isBusy;
};

/**
 * Toggle online status for a user
 * @param {string} userId
 * @returns {Promise<boolean>} - The updated online status
 */
const toggleOnlineStatus = async (userId: string): Promise<boolean> => {
  validateUserAuthorization(userId);

  const user: any = await profileRepository.getById(userId);
  console.log('user', user);

  validateNotFound(user, 'user');

  user.isOnline = !user.isOnline;
  await user.save();

  return user.isOnline;
};
/**
 * Service to update inactive users' subscription settings
 * @param {string} adminId - ID of the admin making the change
 * @param {Partial<IUser>} updateData - Fields to update
 * @returns {Promise<IUser[]>}
 */
export const setAudioVideoPerMin = async (
  adminId: string,
  updateData: { audioCoinsPerMin?: number; videoCoinsPerMin?: number },
): Promise<IUser[]> => {
  validateUserAuthorization(adminId);

  validateRequiredField(updateData.audioCoinsPerMin, 'audioCoinsPerMin');
  validateRequiredField(updateData.videoCoinsPerMin, 'videoCoinsPerMin');

  const inactiveUsers = await profileRepository.fetchSubscriptionInactiveUsers();
  if (!inactiveUsers || inactiveUsers.length === 0) {
    throw new Error('No inactive users found.');
  }

  const updatedUsers = await Promise.all(
    inactiveUsers.map(async (user: any) => {
      return await profileRepository.setAudioVidioPerMin(user._id.toString(), user);
    }),
  );

  return updatedUsers;
};

/**
 * Service to update subscription settings for subscribed users
 * @param {string} userId - ID of the user
 * @param {Partial<IUser>} updateData - Fields to update
 * @returns {Promise<IUser>}
 */
export const setAudioVidioPerMinSubscribedUsers = async (userId: string, updateData: Partial<IUser>): Promise<IUser> => {
  const userSubscribed = await profileRepository.checkUserSubscribed(userId);

  if (!userSubscribed) {
    throw new Error('User is not subscribed or subscription is not active.');
  }
  const updatedUser = await profileRepository.setAudioVidioPerMinSubscribedUsers(userId, updateData);
  validateNotFound(updatedUser, 'user');

  return updatedUser;
};

const listNearestProfiles = async (userId: string, pageNumber: string, pageSize: string, distanceInKm: string, lat: string, lng: string) => {
  validateUserAuthorization(userId);
  return await profileRepository.getNearestProfiles(userId, pageNumber, pageSize, distanceInKm, lat, lng);
};

/**
 * Get all user profiles with pagination and optional filters for admin
 * @param {string} adminId
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @param {Date} options.startDate
 * @param {Date} options.endDate
 * @returns {Promise<{ users: IUser[], hasNext: boolean, totalCount: number }>}
 */
const getAllUsersAdmin = async (
  adminId: string,
  options: {
    pageNumber: number;
    pageSize: number;
    searchTag: string;
    startDate?: Date;
    endDate?: Date;
    gender?: string;
    language?: string;
    country?: string;
    state?: string;
    interest?: string[];
    category?: string[];
    sortBy?: string;
    status?: string;
  },
) => {
  validateUserAuthorization(adminId);

  const {
    users,
    totalCount,
    hasNext,
    totalUsers,
    totalActiveUsers,
    newSignupsThisMonth,
    totalMaleUsers,
    totalFemaleUsers,
    totalOtherUsers,
    totalActiveMaleUsers,
    totalActiveFemaleUsers,
    newMaleSignupsThisMonth,
    newFemaleSignupsThisMonth,
  } = await profileRepository.getAllUsersAdmin(options);

  return {
    users,
    totalCount,
    hasNext,
    totalUsers,
    totalActiveUsers,
    newSignupsThisMonth,
    totalMaleUsers,
    totalFemaleUsers,
    totalOtherUsers,
    totalActiveMaleUsers,
    totalActiveFemaleUsers,
    newMaleSignupsThisMonth,
    newFemaleSignupsThisMonth,
  };
};
/**
 * update coin balance
 * @param {string} userId
 * @returns {Promise<IUser | null>}
 */
const updateCoinBalance = async (userId: string, coins: number): Promise<IUser | null> => {
  validateUserAuthorization(userId);
  const userProfile = await profileRepository.getById(userId);
  validateNotFound(userProfile, 'userProfile');
  const earnedCoins = coins;
  await userRepository.updateCoinBalance(userId, earnedCoins);
  await userRepository.updateEarnedBalance(userId, -earnedCoins);
  return userProfile;
};

const deleteProfileUser = async (userId: string, reason: string): Promise<IUser | null> => {
  validateUserAuthorization(userId);
  const user = await profileRepository.getById(userId);
  validateNotFound(user, 'User');

  const deletedUser = await profileRepository.update(userId, { documentStatus: false, deleteReason: reason, updatedAt: new Date() });
  validateNotFound(deletedUser, 'User failed to delete');
  return deletedUser;
};

const saveRecentPassUsers = async (userId: string, recentPassUsers: string[]): Promise<IRecentPassUsers[]> => {
  if (!recentPassUsers || recentPassUsers.length === 0) {
    throw new ERROR.InvalidInputError('No users passed');
  }

  const entities = recentPassUsers.map(
    (id) => new RecentPassUsersEntity(true, new Types.ObjectId(userId), new Types.ObjectId(id), null, new Date(), null, new Date()),
  );

  return await profileRepository.createManyRecentPassUsers(entities);
};

const getRecentPassUsers = async (
  userId: string,
  pageNumber: string,
  pageSize: string,
): Promise<{ users: IRecentPassUsers[]; count: number; hasNext: boolean; isSubscribed: boolean }> => {
  if (!userId) throw new ERROR.AuthorizationError('Unauthorized');

  const user = await USER.findById(userId).select('subscribedPlanStatus gender');
  if (!user) throw new ERROR.AuthorizationError('User not found');

  const isSubscribed = user.gender === 'Women' ? true : user.subscribedPlanStatus === 'Active';

  const { users, count, hasNext } = await profileRepository.listRecentPassUsers(userId, pageNumber, pageSize);

  if (count === 0) {
    throw validateBadRequest(true, 'You have not passed any profiles yet');
  }

  return { users, count, hasNext, isSubscribed };
};

const getUserSearchFilter = async (userId: string): Promise<{ userSearchFilter: IUserSearchFilter | null; isSubscribed: boolean }> => {
  const user = await USER.findById(userId).select('gender subscribedPlanStatus');
  if (!user) {
    throw new Error('User not found');
  }

  const isSubscribed = user.gender === 'Women' ? true : user.subscribedPlanStatus === 'Active';

  const userSearchFilter = await userRepository.getUserSearchFilter(userId);
  return { userSearchFilter, isSubscribed };
};

const updateUserSearchFilter = async (
  userId: string,
  updateData: Partial<IUserSearchFilter>,
): Promise<{ updatedFilter: IUserSearchFilter | null; isSubscribed: boolean }> => {
  validateUserAuthorization(userId);

  const user = await USER.findById(userId).select('gender subscribedPlanStatus');
  if (!user) {
    throw new Error('User not found');
  }

  const isSubscribed = user.gender === 'Women' ? true : user.subscribedPlanStatus === 'Active';

  const objUserId = new Types.ObjectId(userId);
  const existingFilter = await userRepository.findUserById(objUserId);
  validateNotFound(existingFilter, 'userSearchFilter');

  const updatedFilter = await userRepository.updateUserSearchFilter(userId, updateData);
  validateNotFound(updatedFilter, 'updatedUserSearchFilter');

  return { updatedFilter, isSubscribed };
};

export const removeUserPhotoByAdmin = async (userId: string, index: number) => {
  if (!userId) throw new Error('UserId missing');
  if (isNaN(index)) throw new Error('Invalid index');
  const result = await userRepository.removePhotoByAdmin(userId, index);
  if (!result) throw new Error('User not found');
  return result;
};

export const removeAllUserPhotosByAdmin = async (userId: string) => {
  if (!userId) throw new Error('UserId missing');
  const result = await userRepository.removeAllPhotosByAdmin(userId);
  if (!result) throw new Error('User not found');
  return result;
};

const addUserNote = async (userId: string, note: string, adminId: string | null): Promise<IUser | null> => {
  return userRepository.addUserNote(new Types.ObjectId(userId), note, adminId ? new Types.ObjectId(adminId) : null);
};

const fetchUserNotes = async (userId: string) => {
  return profileRepository.getUserNotes(new Types.ObjectId(userId));
};

const resetUserSearchFilter = async (userId: string): Promise<{ resetFilter: IUserSearchFilter | null; isSubscribed: boolean }> => {
  validateUserAuthorization(userId);

  const user = await USER.findById(userId).select('gender subscribedPlanStatus');
  if (!user) {
    throw new Error('User not found');
  }

  const isSubscribed = user.gender === 'Women' ? true : user.subscribedPlanStatus === 'Active';

  const resetFilter = await userRepository.resetUserSearchFilter(userId);
  validateNotFound(resetFilter, 'userSearchFilter');

  return { resetFilter, isSubscribed };
};

export default {
  getUserProfile,
  updateProfile,
  getAllUsers,
  getProfileDetails,
  uploadImages,
  changeBusy,
  toggleOnlineStatus,
  setAudioVideoPerMin,
  setAudioVidioPerMinSubscribedUsers,
  listNearestProfiles,
  getAllUsersAdmin,
  updateCoinBalance,
  deleteProfileUser,
  saveRecentPassUsers,
  getRecentPassUsers,
  getUserSearchFilter,
  updateUserSearchFilter,
  removeUserPhotoByAdmin,
  removeAllUserPhotosByAdmin,
  addUserNote,
  fetchUserNotes,
  resetUserSearchFilter,
};
