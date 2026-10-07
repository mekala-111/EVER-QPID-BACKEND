import { IUser, SubscribedPlanStatus } from '../models/user/user-model';
import UserEntity from '../entities/user-entity';
import USER from '../models/user/user';
import { Types } from 'mongoose';
import USER_SEARCH_FILTER from '../models/user-search-filter/user-search-filter';
import { IUserSearchFilter } from '../models/user-search-filter/user-search-filter-model';
import { paginate } from '../helper/paginationHelper';
import REPORT from '../models/report/report';
import SUBSCRIPTION_PURCHASE_HISTORY from '../models/subscription-purchase-history/subscription-purchase-history';
import { addDays, isAfter, isBefore } from 'date-fns';

/**
 * Add new user entry to database
 * @param {UserEntity} userEntity
 * @returns {Promise<IUser>}
 */
const createNewUser = async (userEntity: UserEntity): Promise<IUser> => {
  const userData = await new USER(userEntity).save();
  return userData;
};

/**
 * Find user entry by matching country code and phone number
 * @param { String } countryCode
 * @param { String } mobileNumber
 * @returns { Promise<IUser | null> }
 */
const findUser = async (countryCode: string, mobileNumber: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ countryCode, mobileNumber, documentStatus: true });
  return userData;
};

/**
 * Find user entry by matching country code and phone number
 * @param { String } countryCode
 * @param { String } mobileNumber
 * @returns { Promise<IUser | null> }
 */
const findUserByMobile = async (countryCode: string, mobileNumber: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ countryCode, mobileNumber,documentStatus: true });
  return userData;
};

const findUserName = async (userName: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ userName });
  return userData;
};

/**
 * Find User by matching user name
 * @param { String } name
 * @returns { Promise<IUser | null>}
 */
const findUserByUserName = async (name: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ name, documentStatus: true });
  return userData;
};

/**
 * Save fcm token in user document
 * @param { String } userId
 * @param { String } fcmToken
 */
const addFCMToken = async (userId: string, fcmToken: string) => {
  await USER.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: fcmToken } }, { new: true });
};

/**
 * Find a user by id
 * @param { String } id
 * @returns { Promise<IUser | null> }
 */
const findUserById = async (id: Types.ObjectId): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ _id: id, documentStatus: true });
  return userData;
};

/**
 * Update user's coin balance after successful purchase
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
const updateCoinBalance = async (userId: string, amount: number): Promise<void> => {
  await USER.findByIdAndUpdate(userId, { $inc: { coinBalance: amount } }, { new: true });
};

/**
 * Update user's coin balance after successful purchase
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
const updateEarnedBalance = async (userId: string, amount: number): Promise<void> => {
  await USER.findByIdAndUpdate(userId, { $inc: { earnedBalance: amount } }, { new: true });
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<IUser | null>}
 */
const getUserById = async (userId: string): Promise<IUser | null> => {
  return USER.findById(userId);
};

/**
 *
 * @param userType
 * @returns
 */
const getFCMTokens = async (userType: string) => {
  console.log(userType);
  /**
   * @todo add the logic curresponding to different user type
   */
  const users = await USER.find({ documentStatus: true });

  const combinedArray: string[] = users.reduce((accumulator: string[], current: IUser) => {
    if (current.fcmTokens && current.fcmTokens.length > 0) {
      return accumulator.concat(current.fcmTokens);
    }
    return accumulator;
  }, []);
  return combinedArray;
};

/**
 * Find user entry by matching email
 * @param { String } email
 * @returns { Promise<IUser | null> }
 */
const findUserByEmail = async (email: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ email: email, documentStatus: true });
  console.log(userData);

  return userData;
};
const findUserByEmail2 = async (email: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ email:email,documentStatus: true });
  console.log(userData);

  return userData;
};

const getFCMTokensByUserId = async (userId: string): Promise<string[]> => {
  const user = await USER.findById(userId).select('fcmTokens').exec();
  return user?.fcmTokens || [];
};

const findAvailableReceiver = async (searchCondition: any): Promise<IUser[]> => {
  return await USER.find(searchCondition).lean();
};

/**
 * Update user's subscription data after successful purchase
 * @param {string} userId
 * @param {string} planId
 * @returns {Promise<void>}
 */
const updateSubscription = async (userId: string, planId: string): Promise<void> => {
  await USER.findByIdAndUpdate(
    userId,
    {
      $set: {
        subscribedPlanId: planId,
        subscribedPlanStatus: SubscribedPlanStatus.Active,
      },
    },
    { new: true },
  );
};

/* * Find User by matching user name
 * @param { String } userName
 * @returns { Promise<IUser | null>}
 */
const isExistUserName = async (userName: string, id: string): Promise<IUser | null> => {
  let userData: IUser | null;
  if (id) {
    userData = await USER.findOne({ userName, documentStatus: true, id: { $ne: new Types.ObjectId(id) } });
  } else {
    userData = await USER.findOne({ userName, documentStatus: true });
  }
  return userData;
};

const addHiddenContacts = async (userId: string, contactNumbers: string[]) => {
  return await USER.findByIdAndUpdate(userId, { $addToSet: { hiddenContacts: { $each: contactNumbers } } }, { new: true });
};

const removeHiddenContact = async (userId: string, contact: string) => {
  return await USER.findByIdAndUpdate(userId, { $pull: { hiddenContacts: contact } }, { new: true });
};

const getHiddenContacts = async (userId: string) => {
  return await USER.findById(userId).select('hiddenContacts');
};

const updateHiddenContacts = async (userId: string, contacts: string[]) => {
  return await USER.findByIdAndUpdate(userId, { hiddenContacts: contacts }, { new: true });
};

const getUserSearchFilter = async (userId: string): Promise<IUserSearchFilter | null> => {
  return await USER_SEARCH_FILTER.findOne({ userId: new Types.ObjectId(userId) });
};

const updateUserSearchFilter = async (userId: string, updateData: any): Promise<IUserSearchFilter | null> => {
  return await USER_SEARCH_FILTER.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: updateData }, { new: true, upsert: true });
};

export const removePhotoByAdmin = async (userId: string, index: number) => {
  const user = await USER
    .findById(userId)
    .select('profilePhotos profileImageUrl');

  if (!user) return null;

  if (index < 0 || index >= user.profilePhotos.length) {
    throw new Error('Invalid photo index');
  }

  const removed = user.profilePhotos.splice(index, 1);

  // If removed photo was the main profile image
  if (removed[0] === user.profileImageUrl) {
    user.profileImageUrl = user.profilePhotos[0] || '';
  }

  await user.save();

  return {
    removedPhoto: removed,
    photos: user.profilePhotos
  };
};

const findUserEmail = async (email: string): Promise<IUser | null> => {
  const userData: IUser | null = await USER.findOne({ email, documentStatus: true });
  return userData;
};

const updateUser = async (user: IUser): Promise<IUser> => {
  return await user.save();
};

interface PaginateOptions {
  pageNumber: number;
  pageSize: number;
  filters?: any;
}

const paginateHosts = async ({
  pageNumber,
  pageSize,
  filters = {},
}: PaginateOptions): Promise<{ data: IUser[]; totalCount: number; hasNext: boolean }> => {
  return await paginate(USER, { pageNumber, pageSize }, filters);
};

const getSubscriptionStatus = async (userId: string) => {
  const user = await USER.findById(userId).select('subscribedPlanStatus');
  return user?.subscribedPlanStatus;
};

const getUserBasicInfo = async (userId: string) => {
  return USER.findById(userId).select('gender');
};

export const removeAllPhotosByAdmin = async (userId: string) => {
  const user = await USER.findById(userId).select('profilePhotos');
  if (!user) return null;

  const removedPhotos = [...user.profilePhotos];
  user.profilePhotos = [];
  user.profileImageUrl=''
  await user.save();

  return { removedPhotos, photos: user.profilePhotos };
};

const suspendUser = async (userId: string) => {
  return USER.findByIdAndUpdate(userId, {
    $set: {
      isActive: false,
      adminReport: true,
      customerStatus: 'Deactive',
    },
  });
};

const resetUserStatus = async (userId: string) => {
  return USER.findByIdAndUpdate(userId, {
    $set: {
      adminReport: false,
      isActive: true,
    },
  });
};

const isHost = async (userId: string): Promise<boolean> => {
  const user = await USER.findById(userId).select('userType');
  return user?.userType === 'host';
};

const findHostsByEmployee = async (employeeId: string) => {
  return USER.find({
    role: 'host',
    assignedEmployeeId: employeeId,
    documentStatus: true,
  }).select('_id fullName avatar isActive');
};

const addUserNote = async (userId: Types.ObjectId, note: string, adminId: Types.ObjectId | null): Promise<IUser | null> => {
  return USER.findByIdAndUpdate(
    userId,
    {
      $push: {
        notes: {
          note,
          addedBy: adminId,
        },
      },
    },
    { new: true },
  ).lean();
};

const getUserFcmTokens = async (userId: string): Promise<string[]> => {
  const user = await USER.findById(userId).select('fcmTokens');
  return user?.fcmTokens || [];
};

const activateUser = async (userId: string) => {
  return USER.findByIdAndUpdate(
    userId,
    {
      $set: {
        isActive: true,
        adminReport: false,
        customerStatus: 'Active',
      },
    },
    { new: true },
  );
};

const activateUserReports = async (userId: string) => {
  return REPORT.updateMany(
    { reportedUser: userId },
    {
      $set: {
        isResolved: true,
      },
    },
  );
};

const findUserPreferences = async (userId: Types.ObjectId): Promise<IUserSearchFilter | null> => {
  return USER_SEARCH_FILTER.findOne({ userId }).lean();
};

const getFCMTokensByGender = async (gender: string): Promise<string[]> => {
  const users = await USER.find({ gender, fcmTokens: { $exists: true, $ne: [] }, documentStatus: true });
  return users.flatMap((user) => user.fcmTokens);
};

const getFCMTokensForNewUsers = async (): Promise<string[]> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const users = await USER.find({
    createdAt: { $gte: sevenDaysAgo },
    fcmTokens: { $exists: true, $ne: [] },
    documentStatus: true,
  });

  const tokens = users.flatMap((user) => user.fcmTokens);

  return tokens;
};

const getFCMTokensNotSubscribed = async (): Promise<string[]> => {
  const users = await USER.find({
    subscribedPlanStatus: { $in: ['None', 'Inactive', 'Expired'] },
    documentStatus: true,
    fcmTokens: { $exists: true, $ne: [] },
  });

  const tokens = users.flatMap((user) => user.fcmTokens);
  return tokens;
};

export const getFCMTokensWithExpiringPlan = async (daysBeforeExpiry: number = 7): Promise<string[]> => {
  const now = new Date();
  const thresholdDate = addDays(now, daysBeforeExpiry);

  const subscriptions = await SUBSCRIPTION_PURCHASE_HISTORY.find({
    planStatus: 'Active',
    documentStatus: true,
  }).populate<{ userId: IUser }>('userId');

  const expiringUsers = subscriptions
    .filter((sub) => {
      const user = sub.userId as IUser | null;
      if (!user || !user.fcmTokens?.length) return false;

      const purchaseDate = sub.createdAt;
      if (!purchaseDate) return false;

      let expiryDate: Date | null = null;

      switch (sub.durationUnit) {
        case 'Minutes':
          expiryDate = new Date(purchaseDate.getTime() + sub.durationValue * 60_000);
          break;
        case 'Hours':
          expiryDate = new Date(purchaseDate.getTime() + sub.durationValue * 3_600_000);
          break;
        case 'Days':
          expiryDate = new Date(purchaseDate.getTime() + sub.durationValue * 86_400_000);
          break;
        case 'Weeks':
          expiryDate = new Date(purchaseDate.getTime() + sub.durationValue * 7 * 86_400_000);
          break;
        case 'Months':
          expiryDate = new Date(purchaseDate);
          expiryDate.setMonth(expiryDate.getMonth() + sub.durationValue);
          break;
        default:
          return false;
      }

      return isAfter(expiryDate, now) && isBefore(expiryDate, thresholdDate);
    })
    .map((sub) => sub.userId as IUser);

  const tokens = expiringUsers.flatMap((user: IUser) => user.fcmTokens || []);

  return tokens;
};

const resetUserSearchFilter = async (userId: string): Promise<IUserSearchFilter | null> => {
  const defaultFilter = {
    locationString: '',
    lat: 0,
    lng: 0,
    distance: 0,
    minAge: 0,
    maxAge: 0,
    minHeight: 0,
    maxHeight: 0,
    looking: [],
    otherLanguages: [],
    education: '',
    profession: '',
    religion: '',
    maritalStatus: '',
    interestedIn: '',
    allowOutOfDistance: false,
    allowOutOfAgeRange: false,
  };

  return await USER_SEARCH_FILTER.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: defaultFilter }, { new: true, upsert: true });
};

const updateLastActive = async (userId: string) => {
  await USER.findByIdAndUpdate(userId, {
    lastActive: new Date(),
    isOnline: true,
  });
};

const getHostByIdAndEmployee = async (hostId: string, employeeId: string) => {
  return USER.findOne({
    _id: hostId,
    assignedEmployee: employeeId,
    isHostProfile: true,
  }).lean();
};

export default {
  createNewUser,
  findUser,
  findUserByUserName,
  addFCMToken,
  findUserById,
  updateCoinBalance,
  findUserName,
  getUserById,
  getFCMTokens,
  updateEarnedBalance,
  findUserByEmail,
  getFCMTokensByUserId,
  findAvailableReceiver,
  updateSubscription,
  isExistUserName,
  addHiddenContacts,
  removeHiddenContact,
  getHiddenContacts,
  updateHiddenContacts,
  getUserSearchFilter,
  updateUserSearchFilter,
  removePhotoByAdmin,
  findUserEmail,
  updateUser,
  paginateHosts,
  getSubscriptionStatus,
  getUserBasicInfo,
  removeAllPhotosByAdmin,
  suspendUser,
  resetUserStatus,
  isHost,
  findHostsByEmployee,
  addUserNote,
  getUserFcmTokens,
  activateUser,
  activateUserReports,
  findUserPreferences,
  getFCMTokensByGender,
  getFCMTokensForNewUsers,
  getFCMTokensNotSubscribed,
  getFCMTokensWithExpiringPlan,
  resetUserSearchFilter,
  updateLastActive,
  getHostByIdAndEmployee,
  findUserByMobile,
  findUserByEmail2
};
