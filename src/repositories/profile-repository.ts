import { Types } from 'mongoose';
import { excludedItems, paginate } from '../helper/paginationHelper';
import USER from '../models/user/user';
import { IUser, SubscribedPlanStatus } from '../models/user/user-model';
import ERROR from '../middlewares/web_server/http-error';
import blockRepository from './block-repository';
import RECENT_PASS_USERS from '../models/recent-pass-users/recent-pass-users';
import { IRecentPassUsers } from '../models/recent-pass-users/recent-pass-users-model';
import RecentPassUsersEntity from '../entities/recent-pass-users';
import { IBlock } from '../models/block/block-model';
import MATCHING from '../models/matching/matching';
import USER_SEARCH_FILTER from '../models/user-search-filter/user-search-filter';
import { IUserSearchFilter } from '../models/user-search-filter/user-search-filter-model';

/**
 * Fetch a user profile by ID and populate interests
 * @param {string} userId -
 * @returns {Promise<IUser | null>} -
 */

const getById = async (userId: string): Promise<IUser | null> => {
  const user = await USER.findById(userId, excludedItems).lean().exec();

  if (!user) return null;

  return user;
};

/**
 * Update a user profile by ID
 * @param {string} userId
 * @param {Partial<IUser>} updateData
 * @returns {Promise<IUser | null>}
 */
const update = async (userId: string, updateData: Partial<IUser>): Promise<IUser | null> => {
  return await USER.findByIdAndUpdate(userId, updateData, { new: true }).exec();
};

/**
 * Find a user by username, checking if the username is already taken by another user.
 * @param {string | undefined} userName
 * @param {string | undefined} excludeUserId
 * @returns {Promise<IUser | null>}
 */
const findUserNameAlredyExists = async (userName: string | undefined, excludeUserId?: string): Promise<IUser | null> => {
  if (!userName) {
    return null;
  }
  const query = excludeUserId ? { userName, _id: { $ne: excludeUserId } } : { userName };

  return await USER.findOne(query).exec();
};

/**
 * Find a user by mobile number, checking if the mobile number is already taken by another user.
 * @param {string | undefined} mobileNumber
 * @param {string | undefined} excludeUserId
 * @returns {Promise<IUser | null>}
 */
const findMobileNumberAlreadyExists = async (mobileNumber: string | undefined, excludeUserId?: string): Promise<IUser | null> => {
  if (!mobileNumber) {
    return null;
  }
  const query = excludeUserId ? { mobileNumber, _id: { $ne: excludeUserId } } : { mobileNumber };
  return await USER.findOne(query).exec();
};

/**
 * Get all user profiles with pagination, optional filters, and sorting
 * @param {object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @param {Date} options.startDate
 * @param {Date} options.endDate
 * @param {string} options.gender
 * @param {string} options.language
 * @param {string} options.country
 * @param {string} options.state
 * @param {string} options.interest
 * @param {string} options.profession
 * @param {string} options.sortBy
 * @returns {Promise<{ users: IUser[], totalCount: number, hasNext: boolean }>}
 */

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

function getDateFromAge(age: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
}

const getAllUsers = async ({
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
}: {
  userId: string;
  pageNumber: number;
  pageSize: number;
  searchTag?: string;
  startDate?: Date;
  endDate?: Date;
  gender?: string;
  language?: string;
  country?: string;
  state?: string;
  interest?: string[];
  category?: string[];
  sortBy?: string;
}): Promise<{ users: IUser[]; totalCount: number; hasNext: boolean }> => {
  const [blockedMe, iBlocked, likedUsers, recentPassed, currentUser, preference]: [
    IBlock[],
    IBlock[],
    { toUserId: Types.ObjectId }[],
    { recentPassUser: Types.ObjectId }[],
    { hiddenContacts?: string[] } | null,
    IUserSearchFilter | null,
  ] = await Promise.all([
    blockRepository.getUsersWhoBlockedMe(userId),
    blockRepository.getUsersBlockedByMe(userId),
    MATCHING.find({ fromUserId: userId, documentStatus: true }).select('toUserId').lean(),
    RECENT_PASS_USERS.find({ userId, documentStatus: true }).select('recentPassUser').lean(),
    USER.findById(userId).select('hiddenContacts').lean(),
    USER_SEARCH_FILTER.findOne({ userId }).lean(),
  ]);

  //const blockedMe: IBlock[] = await blockRepository.getUsersWhoBlockedMe(userId);

  //const iBlocked: IBlock[] = await blockRepository.getUsersBlockedByMe(userId);

  const blockedUserIds = new Set([...blockedMe.map((b) => b.blockedBy.toString()), ...iBlocked.map((b) => b.blockedAccount.toString())]);

  // const likedUsers = await MATCHING.find({
  //   fromUserId: userId,
  //   documentStatus: true,
  // })
  //   .select('toUserId')
  //   .lean();

  const likedUserIds = likedUsers.map((like) => like.toUserId.toString());

  // const recentPassed = await RECENT_PASS_USERS.find({
  //   userId,
  //   documentStatus: true,
  // })
  //   .select('recentPassUser')
  //   .lean();

  const recentPassUserIds = recentPassed.map((p) => p.recentPassUser.toString());

  //const currentUser = await USER.findById(userId).select('hiddenContacts').lean();
  const hiddenContacts = currentUser?.hiddenContacts || [];

  const excludedUserIds = new Set([userId, ...blockedUserIds, ...likedUserIds, ...recentPassUserIds]);

  const excludedObjectIds = [...excludedUserIds].slice(0, 300).map((id) => new Types.ObjectId(id));
  
  //const preference = await USER_SEARCH_FILTER.findOne({ userId: userId }).lean();

  const filters: any = {
    customerStatus: 'Active',
    documentStatus: true,
    _id: {
      $nin: excludedObjectIds,
    },
    mobileNumber: { $nin: hiddenContacts },
  };

  if (searchTag) {
    filters.$or = [
      { userName: { $regex: searchTag, $options: 'i' } },
      { name: { $regex: searchTag, $options: 'i' } },
      { fullName: { $regex: searchTag, $options: 'i' } },
      { mobileNumber: { $regex: searchTag, $options: 'i' } },
    ];
  }
  console.log(preference);

  if (preference) {
    if (preference.minHeight >= 100 && preference.maxHeight > preference.minHeight) {
      filters.height = {
        $gte: preference.minHeight,
        $lte: preference.maxHeight,
      };
    }

    if (preference.interestedIn === 'Women') {
      gender = 'Women';
    } else if (preference.interestedIn === 'Men') {
      gender = 'Man';
    }

    if (preference.looking?.length) {
      filters.relationshipGoals = { $in: preference.looking };
    }

    if (preference.otherLanguages?.length) {
      filters.otherLanguages = { $in: preference.otherLanguages };
    }

    if (preference.maritalStatus) {
      filters.relationshipStatus = preference.maritalStatus;
    }

    if (preference.allowOutOfAgeRange === false && typeof preference.minAge === 'number' && typeof preference.maxAge === 'number') {
      filters.dateOfBirth = {
        $gte: getDateFromAge(preference.maxAge),
        $lte: getDateFromAge(preference.minAge),
      };
    }

    if (preference && !preference.allowOutOfDistance && preference.lat && preference.lng && preference.distance) {
      filters.location = {
        $geoWithin: {
          $centerSphere: [[preference.lng, preference.lat], preference.distance / 6371000],
        },
      };
    }
  }

  if (startDate && endDate) {
    filters.createdAt = { $gte: startDate, $lte: endDate };
  }

  if (gender) {
    filters.gender = gender;
  }

  if (language) {
    filters.languages = { $in: [language] };
  }

  if (country) {
    filters.country = { $regex: country, $options: 'i' };
  }
  if (state) {
    filters.state = { $regex: state, $options: 'i' };
  }

  if (interest && interest.length > 0) {
    filters.interests = { $in: interest };
  }

  if (category && Array.isArray(category) && category.length > 0) {
    filters.categories = { $in: category.map((id) => new Types.ObjectId(id)) };
  }
  console.log(filters);

  //Sorting
  const sortPipeline: any[] = [];
  if (sortBy === 'rating') {
    sortPipeline.push({ $sort: { rating: -1 } });
  } else if (sortBy === 'name') {
    sortPipeline.push({ $sort: { fullName: 1 } });
  } else {
    sortPipeline.push({ $sort: { createdAt: -1 } });
  }

  const {
    data: users,
    totalCount,
    hasNext,
  } = await paginate(
    USER,
    { pageNumber, pageSize },
    filters,
    sortPipeline, // Pass as an array
  );

  const usersWithAge = users.map((user: IUser) => ({
    ...user,
    age: calculateAge(user.dateOfBirth),
    interests: user.interests,
  }));

  return { users: usersWithAge, totalCount, hasNext };
};

/**
 * Fetch a user profile by username
 * @param {string} userName
 * @returns {Promise<IUser | null>}
 */
const getByUserName = async (userName: string): Promise<IUser | null> => {
  return await USER.findOne({ userName }).exec();
};

/**
 * uploadImage
 * @param {string} imageUrl
 * @param {string} userId
 * @returns {Promise<IUser | null>}
 */
const uploadImages = async (imageUrls: string[], userId: string): Promise<IUser | null> => {
  return await USER.findByIdAndUpdate(userId, { $push: { profilePhotos: { $each: imageUrls } } }, { new: true }).exec();
};

/**
 * Repository to fetch inactive users
 * @returns {Promise<IUser[]>}
 */
const fetchSubscriptionInactiveUsers = async (): Promise<IUser[]> => {
  return await USER.find({ subscribedPlanStatus: SubscribedPlanStatus.Inactive }).exec();
};

/**
 * Repository to update user by ID
 * @param {string} id - User ID
 * @param {Partial<IUser>} updateData - Data to update
 * @returns {Promise<IUser>}
 */
const setAudioVidioPerMin = async (id: string, updateData: Partial<IUser>): Promise<IUser> => {
  const updatedUser: any = await USER.findByIdAndUpdate(id, updateData, { new: true }).exec();
  return updatedUser;
};

/**
 * Repository to check if a user is subscribed
 * @param {string} userId - User ID
 * @returns {Promise<IUser | null>}
 */
const checkUserSubscribed = async (userId: string): Promise<IUser | null> => {
  return await USER.findOne({ _id: userId, subscribedPlanStatus: SubscribedPlanStatus.Active }).exec();
};

/**
 * Repository to update user's subscription settings
 * @param {string} userId - User ID
 * @param {Partial<IUser>} updateData - Data to update
 * @returns {Promise<IUser>}
 */
const setAudioVidioPerMinSubscribedUsers = async (userId: string, updateData: Partial<IUser>): Promise<IUser> => {
  const updatedUser: any = await USER.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  return updatedUser;
};
/**
 * Get nearest profiles
 * @param loginUserId
 * @param pageNumber
 * @param pageSize
 * @param searchTag
 * @param isVerified
 * @param professionId
 * @param distanceInKm
 * @param gender
 * @param handledProjectsCountFrom
 * @param handledProjectsCountTo
 * @returns
 */
const getNearestProfiles = async (loginUserId: string, pageNumber: string, pageSize: string, distanceInKm: string, lat: string, lng: string) => {
  const findUserProfile = await USER.findById(loginUserId);

  const blockedMe = await blockRepository.getUsersWhoBlockedMe(loginUserId);

  const blockedUserIds = new Set(Array.isArray(blockedMe) ? blockedMe.map((block: any) => block.blockedBy.toString()) : []);

  if (findUserProfile && findUserProfile._id) {
    let skip = 0;
    let limit = 12;
    let hasNext = false;

    if (pageSize) limit = parseInt(pageSize);
    if (pageNumber) skip = (parseInt(pageNumber) - 1) * limit;

    const findQuery: any = {
      documentStatus: true,
      _id: {
        $ne: new Types.ObjectId(loginUserId),
        $nin: [...blockedUserIds],
      },
    };

    const count = await USER.countDocuments(findQuery);
    if (!pageSize) limit = count;

    if (count > skip + limit) {
      hasNext = true;
    }

    let customerLocation = {
      latitude: findUserProfile.lat,
      longitude: findUserProfile.lng,
    };

    if (lat && lng && (lat !== findUserProfile.lat.toString() || lng !== findUserProfile.lng.toString())) {
      customerLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      };
    }

    /**
     * @todo save this variable in a common collection and fetch it from there.
     */
    let maxDistance = 10000;

    if (distanceInKm) {
      maxDistance = parseInt(distanceInKm) * 1000;
    }

    const profiles = await USER.find(
      {
        ...findQuery,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [customerLocation.longitude, customerLocation.latitude] },
            $maxDistance: maxDistance,
          },
        },
      },
      '-documentStatus -createdUser -updatedUser -updatedAt -__v',
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { profiles, count, hasNext };
  } else {
    throw new ERROR.NotFoundError('User not found!');
  }
};

const getAllUsersAdmin = async ({
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
  status,
}: {
  pageNumber: number;
  pageSize: number;
  searchTag?: string;
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
}): Promise<{
  users: IUser[];
  totalCount: number;
  hasNext: boolean;
  totalUsers: number;
  totalActiveUsers: number;
  newSignupsThisMonth: number;
  totalMaleUsers: number;
  totalFemaleUsers: number;
  totalOtherUsers: number;
  totalActiveMaleUsers: number;
  totalActiveFemaleUsers: number;
  newMaleSignupsThisMonth: number;
  newFemaleSignupsThisMonth: number;
}> => {
  const filters: any = { documentStatus: true };

  if (searchTag) {
    filters.$or = [
      { userName: { $regex: searchTag, $options: 'i' } },
      { name: { $regex: searchTag, $options: 'i' } },
      { fullName: { $regex: searchTag, $options: 'i' } },
      { mobileNumber: { $regex: searchTag, $options: 'i' } },
    ];
  }

  if (startDate && endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    filters.createdAt = { $gte: startDate, $lte: endOfDay };
  } else if (startDate) {
    filters.createdAt = { $gte: startDate };
  } else if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    filters.createdAt = { $lte: endOfDay };
  }

  if (gender) {
    filters.gender = gender;
  }

  if (language) {
    filters.languages = { $in: [language] };
  }

  if (country) {
    filters.country = { $regex: country, $options: 'i' };
  }
  if (state) {
    filters.state = { $regex: state, $options: 'i' };
  }

  if (interest && interest.length > 0) {
    filters.interests = { $in: interest };
  }

  if (category && Array.isArray(category) && category.length > 0) {
    filters.categories = { $in: category.map((id) => new Types.ObjectId(id)) };
  }

  if (status) {
    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }
  }

  const sortPipeline: any[] = [];
  if (sortBy === 'rating') {
    sortPipeline.push({ $sort: { rating: -1 } });
  } else if (sortBy === 'name') {
    sortPipeline.push({ $sort: { name: 1 } });
  }

  const { data: users, totalCount, hasNext } = await paginate(USER, { pageNumber, pageSize }, filters, sortPipeline);

  const totalUsers = await USER.countDocuments({ documentStatus: true });
  const totalActiveUsers = await USER.countDocuments({ documentStatus: true, isActive: true });
  const totalMaleUsers = await USER.countDocuments({ documentStatus: true, gender: 'Man' });
  const totalFemaleUsers = await USER.countDocuments({ documentStatus: true, gender: 'Women' });
  const totalOtherUsers = await USER.countDocuments({ documentStatus: true, gender: 'Other' });

  // Active users by gender
  const totalActiveMaleUsers = await USER.countDocuments({
    documentStatus: true,
    isActive: true,
    gender: 'Man',
  });

  const totalActiveFemaleUsers = await USER.countDocuments({
    documentStatus: true,
    isActive: true,
    gender: 'Women',
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const newSignupsThisMonth = await USER.countDocuments({
    documentStatus: true,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  // New signups this month by gender
  const newMaleSignupsThisMonth = await USER.countDocuments({
    documentStatus: true,
    gender: 'Man',
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const newFemaleSignupsThisMonth = await USER.countDocuments({
    documentStatus: true,
    gender: 'Women',
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

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
 * Update all hosts based on their account type
 * @param {number} normalAudioCoins - Normal audio coins per minute
 * @param {number} normalVideoCoins - Normal video coins per minute
 */
const updateNonSubcribedUsers = async (normalAudioCoins: number, normalVideoCoins: number) => {
  await USER.updateMany(
    { subscribedPlanStatus: { $ne: 'Active' } },
    {
      $set: {
        audioCoinsPerMin: normalAudioCoins,
        videoCoinsPerMin: normalVideoCoins,
      },
    },
  );
};
export const setUserOnline = async (userId: string) => {
  try {
    await USER.findByIdAndUpdate(userId, { isOnline: true });
    console.log(`🔵 User ${userId} is now online.`);
  } catch (err) {
    console.error(`Failed to set user online:`, err);
  }
};

export const setUserOffline = async (userId: string) => {
  try {
    await USER.findByIdAndUpdate(userId, { isOnline: false, lastActive: new Date() });
    console.log(`⚫ User ${userId} is now offline.`);
  } catch (err) {
    console.error(`Failed to set user offline:`, err);
  }
};

export const setUserBusy = async (userId: string) => {
  try {
    await USER.findByIdAndUpdate(userId, { isBusy: false });
    console.log(`⚫ User ${userId} is available.`);
  } catch (err) {
    console.error(`Failed to set user busy status:`, err);
  }
};

export const createManyRecentPassUsers = async (entities: RecentPassUsersEntity[]): Promise<IRecentPassUsers[]> => {
  return await RECENT_PASS_USERS.insertMany(entities);
};

const listRecentPassUsers = async (
  userId: string,
  pageNumber: string,
  pageSize: string,
): Promise<{ users: IRecentPassUsers[]; count: number; hasNext: boolean }> => {
  let skip = 0;
  let limit = 10;
  let hasNext = false;

  if (pageSize) limit = parseInt(pageSize);
  if (pageNumber) skip = (parseInt(pageNumber) - 1) * limit;

  const userObjectId = new Types.ObjectId(userId);

  const pipeline: any[] = [
    {
      $match: {
        documentStatus: true,
        userId: userObjectId,
      },
    },
    {
      $lookup: {
        from: 'cln_matchings',
        let: { passedUserId: '$recentPassUser' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$fromUserId', userObjectId] }, { $eq: ['$toUserId', '$$passedUserId'] }],
              },
            },
          },
        ],
        as: 'likeInfo',
      },
    },
    {
      $match: {
        likeInfo: { $size: 0 },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];

  const countPipeline = [...pipeline, { $count: 'count' }];
  const countResult = await RECENT_PASS_USERS.aggregate(countPipeline);
  const count = countResult[0]?.count || 0;

  if (!pageSize && count > 0) limit = count;

  pipeline.push({ $skip: skip }, { $limit: limit });

  pipeline.push({
    $lookup: {
      from: 'cln_users',
      localField: 'recentPassUser',
      foreignField: '_id',
      as: 'recentPassUser',
    },
  });

  pipeline.push({ $unwind: '$recentPassUser' });

  const users = await RECENT_PASS_USERS.aggregate(pipeline);

  if (count > skip + limit) hasNext = true;

  return { users, count, hasNext };
};

const getUserNotes = async (
  userId: Types.ObjectId,
): Promise<{ notes: { note: string; addedBy: string | null; createdAt: Date }[]; updatedAt: Date | null } | null> => {
  const user = await USER.findById(userId).select('notes updatedAt').lean();

  if (!user) return null;

  return {
    notes: user.notes.map((n) => ({
      note: n.note,
      addedBy: n.addedBy?.toString() || null,
      createdAt: n.createdAt,
    })),
    updatedAt: user.updatedAt,
  };
};

export const deleteManyRecentPassUsers = async (userId: string): Promise<void> => {
  await RECENT_PASS_USERS.deleteMany({
    userId: new Types.ObjectId(userId),
  });
};

export default {
  getById,
  update,
  findUserNameAlredyExists,
  findMobileNumberAlreadyExists,
  getAllUsers,
  getByUserName,
  uploadImages,
  fetchSubscriptionInactiveUsers,
  setAudioVidioPerMin,
  setAudioVidioPerMinSubscribedUsers,
  checkUserSubscribed,
  getNearestProfiles,
  getAllUsersAdmin,
  updateNonSubcribedUsers,
  createManyRecentPassUsers,
  listRecentPassUsers,
  getUserNotes,
  deleteManyRecentPassUsers,
};
