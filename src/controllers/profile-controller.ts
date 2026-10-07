import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/user/user-model';
import ApiResponse from '../utils/api-response';
import { blockService, favouriteService, matchingService, profileService } from '../services';
import { validateRequiredField, validateUserAuthorization } from '../utils/validators';
import { IRecentPassUsers } from '../models/recent-pass-users/recent-pass-users-model';
import { IUserSearchFilter } from '../models/user-search-filter/user-search-filter-model';
import USER from '../models/user/user';
import { parsePagination } from '../utils/pagination';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import ERROR from '../middlewares/web_server/http-error';
import { Types } from 'mongoose';
import calculateAge from '../helper/calculateAgeHelper';

/**
 * Get user profile
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    const userProfile: IUser | null = await profileService.getUserProfile(userId);

    if (userProfile) {
      const lastActiveFormatted = userProfile.lastActive?.toISOString();
      const apiResponse: ApiResponse<{ userProfile: IUser | null; lastActive?: string; isActive?: boolean }> = new ApiResponse();
      apiResponse.message = 'Profile retrieved successfully!';
      apiResponse.data = {
        userProfile,
        lastActive: lastActiveFormatted,
        isActive: userProfile.isActive ?? true,
      };
      apiResponse.statusCode = 200;
      res.json(apiResponse);
    } else {
      throw new Error('User profile not found');
    }
  } catch (e) {
    next(e);
  }
};

/**
 * Update user profile
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      userId,
      userName,
      fullName,
      email,
      mobileNumber,
      gender,
      zodiacSign,
      alcoholConsumption,
      workoutFrequency,
      smokingHabit,
      country,
      state,
      city,
      categories,
      languages,
      currentProfession,
      interests,
      bio,
      aboutMe,
      religion,
      relationshipGoals,
      employmentType,
      education,
      collegeName,
      profileImageUrl,
      profilePhotos,
      companyName,
      roleInCompany,
      graduationYear,
      currentlyStudying,
      height,
      relationshipStatus,
      otherLanguages,
    } = req.body;

    const updateData = {
      userName,
      fullName,
      email,
      mobileNumber,
      gender,
      zodiacSign,
      alcoholConsumption,
      workoutFrequency,
      smokingHabit,
      country,
      state,
      city,
      categories,
      languages,
      currentProfession,
      interests,
      bio,
      aboutMe,
      religion,
      relationshipGoals,
      employmentType,
      education,
      collegeName,
      profileImageUrl,
      profilePhotos,
      companyName,
      roleInCompany,
      graduationYear,
      currentlyStudying,
      height,
      relationshipStatus,
      otherLanguages,
    };

    const updatedProfile = await profileService.updateProfile(userId, updateData);

    const apiResponse: ApiResponse<{ updatedProfile: IUser | null }> = new ApiResponse<{
      updatedProfile: IUser | null;
    }>();
    apiResponse.message = 'Profile updated successfully!';
    apiResponse.data = { updatedProfile };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all user profiles (Admin only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllProfilesAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const pageNumber: string = req.query.pageNumber ? (req.query.pageNumber as string) : '1';
    const pageSize: string = req.query.pageSize ? (req.query.pageSize as string) : '10';
    const searchTag: string = req.query.searchTag ? (req.query.searchTag as string) : '';
    const startDate: string = req.query.startDate ? (req.query.startDate as string) : '';
    const endDate: string = req.query.endDate ? (req.query.endDate as string) : '';
    const status: string = req.query.status ? (req.query.status as string) : 'all';
    const gender: string = req.query.gender ? (req.query.gender as string) : '';

    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    const result = await profileService.getAllUsersAdmin(adminId, {
      pageNumber: parseInt(pageNumber, 10),
      pageSize: parseInt(pageSize, 10),
      searchTag,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      status,
      gender,
    });
    const apiResponse: ApiResponse<{ users: IUser[]; hasNext: boolean; totalCount: number }> = new ApiResponse<{
      users: IUser[];
      hasNext: boolean;
      totalCount: number;
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
    }>();
    apiResponse.message = 'Success!';
    apiResponse.data = result;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all user profiles (Admin only)
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getAllProfilesUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
     const userProfile: IUser | null = await profileService.getUserProfile(userId);
      if (!userProfile) { 
      throw new ERROR.AuthorizationError('Unautherized');
      }
      
    const pageNumber = parseInt((req.query.pageNumber as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
    const searchTag = (req.query.searchTag as string) || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const gender = userProfile.gender === 'Man' ? 'Women' : userProfile.gender === 'Women' ? 'Man' : req.query.gender? (req.query.gender as string) : '';
    const language = req.query.language as string;
    const country = req.query.country as string;
    const state = req.query.state as string;

    const interest = typeof req.query.interest === 'string' ? req.query.interest.split(',') : (req.query.interest as string[]) || [];
    const category = typeof req.query.category === 'string' ? req.query.category.split(',') : (req.query.category as string[]) || [];

    const sortBy = req.query.sortBy as string;
   

    const { users, hasNext, totalCount } = await profileService.getAllUsers(userId, {
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

    const apiResponse: ApiResponse<{ users: IUser[]; hasNext: boolean; totalCount: number }> = new ApiResponse<{
      users: IUser[];
      hasNext: boolean;
      totalCount: number;
    }>();
    apiResponse.message = 'Success!';
    apiResponse.data = { users, hasNext, totalCount };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get user profile
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */

const getProfileDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    const { userProfile, sideProfileDetails } = await profileService.getProfileDetails(adminId, userId);

    const isBlocked: boolean = !!(await blockService.findAdminBlock(userId));
    if (userProfile) {
      userProfile.isBlocked = isBlocked;
    }

    const apiResponse: ApiResponse<{ userProfile: any; sideProfileDetails: any }> = new ApiResponse();
    apiResponse.message = 'Profile retrieved successfully!';
    apiResponse.data = { userProfile, sideProfileDetails };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * uploadImage
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { imageUrls, userId } = req.body;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      res.status(400).json({ status: false, message: 'imageUrls must be a non-empty array' });
      return;
    }

    const updatedUser: IUser | null = await profileService.uploadImages(imageUrls, userId);

    const apiResponse: ApiResponse<{ profilePhotos: string[] }> = new ApiResponse();
    apiResponse.message = 'Profile image uploaded successfully!';
    apiResponse.data = { profilePhotos: updatedUser?.profilePhotos || [] }; // Ensure key matches the type
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};
/**
 * Change online status of a user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const changeOnlineStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const updatedProfile: any = await profileService.toggleOnlineStatus(userId);
    const apiResponse = new ApiResponse<IUser | null>();
    apiResponse.message = 'Online status updated successfully!';
    apiResponse.data = updatedProfile;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle admin updating inactive users' subscription settings
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const setAudioVidioPerMin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiResponse: ApiResponse<IUser | null> = new ApiResponse<IUser | null>();
    apiResponse.message = 'Subscription settings updated successfully for inactive user!!';
    //apiResponse.data = udpateAudioVideo;
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all other profiles
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getNearestProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.body.userId as string) || '';
    const pageNumber: string = req.query.pageNumber ? (req.query.pageNumber as string) : '';
    const pageSize: string = req.query.pageSize ? (req.query.pageSize as string) : '';
    const distanceInKm = req.query.distanceInKm ? (req.query.distanceInKm as string) : '';
    const lat: string = req.query.lat ? (req.query.lat as string) : '';
    const lng: string = req.query.lng ? (req.query.lng as string) : '';
    const profiles = await profileService.listNearestProfiles(userId, pageNumber, pageSize, distanceInKm, lat, lng);
    const apiRespose: ApiResponse<{ profiles: IUser[]; count: number; hasNext: boolean }> = new ApiResponse<{
      profiles: IUser[];
      count: number;
      hasNext: boolean;
    }>();
    apiRespose.message = 'Success!';
    apiRespose.data = profiles;
    apiRespose.statusCode = 200;
    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Get Profile Details from admin
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */

const getOtherProfileDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    validateUserAuthorization(userId);
    const profileId: string = req.params.profileId;
    validateRequiredField(profileId, 'profileId');

    let userProfile: IUser | null = await profileService.getUserProfile(profileId);
    const isFavorite: boolean = !!(await favouriteService.findFavorite(userId, profileId));
    const isBlocked: boolean = !!(await blockService.findBlock(userId, profileId));

    if (userProfile) {
      const profileObj = userProfile.toObject?.() ?? userProfile;

      const age = profileObj.dateOfBirth ? calculateAge(profileObj.dateOfBirth) : null;

      userProfile = {
        //...(userProfile.toObject?.() ?? userProfile),
        ...profileObj,
        age,
        isBlocked,
        isFavorite,
      };
    }

    const apiRespose: ApiResponse<{ profileDetails: IUser | null }> = new ApiResponse<{ profileDetails: IUser | null }>();
    apiRespose.message = 'Success!';
    apiRespose.data = { profileDetails: userProfile };
    apiRespose.statusCode = 200;

    res.json(apiRespose);
  } catch (e) {
    next(e);
  }
};

/**
 * Add earned balance to coin balance
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const addToCoinBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, coins } = req.body;
    await profileService.updateCoinBalance(userId, coins);

    const apiResponse: ApiResponse<{ updatedProfile: IUser | null }> = new ApiResponse<{
      updatedProfile: IUser | null;
    }>();
    apiResponse.message = 'Successfully updated coin balance!';
    apiResponse.data = { updatedProfile: null };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};
const deleteProfileUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, reason } = req.body;
    const deletedUser: IUser | null = await profileService.deleteProfileUser(userId, reason);

    const apiResponse = new ApiResponse<{ userProfile: IUser | null }>();
    apiResponse.message = 'Profile deleted successfully!';
    apiResponse.data = { userProfile: deletedUser };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const saveRecentPassUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, recentPassUsers } = req.body;

    const result: IRecentPassUsers[] = await profileService.saveRecentPassUsers(userId, recentPassUsers);

    const apiResponse = new ApiResponse<{ saved: IRecentPassUsers[] }>();
    apiResponse.message = 'Recent pass users saved successfully!';
    apiResponse.data = { saved: result };
    apiResponse.statusCode = 201;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const listRecentPassUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.body?.userId;

    const pageNumber: string = (req.query.pageNumber as string) || '';
    const pageSize: string = (req.query.pageSize as string) || '';

    const result = await profileService.getRecentPassUsers(userId, pageNumber, pageSize);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Recent pass users fetched successfully!';
    apiResponse.data = result;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getSearchFilter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { userSearchFilter, isSubscribed } = await profileService.getUserSearchFilter(userId);

    const response: ApiResponse<{ userSearchFilter: IUserSearchFilter | null; isSubscribed: boolean }> = new ApiResponse();
    response.message = 'Search filter retrieved successfully';
    response.data = { userSearchFilter, isSubscribed };
    response.statusCode = 200;
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const updateUserPreferenceFilter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;

    const { updatedFilter, isSubscribed } = await profileService.updateUserSearchFilter(obj.userId, obj);

    const apiResponse: ApiResponse<{ updatedFilter: IUserSearchFilter | null; isSubscribed: boolean }> = new ApiResponse();
    apiResponse.message = 'User search filter updated successfully!';
    apiResponse.data = { updatedFilter, isSubscribed };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getAllFemaleUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.query.gender = 'Female';
    await getAllProfilesUsers(req, res, next);
  } catch (e) {
    next(e);
  }
};

const getAllMaleUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.query.gender = 'Male';
    await getAllProfilesUsers(req, res, next);
  } catch (e) {
    next(e);
  }
};

const getUserPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(new Error('UserId missing'));
    }

    const user = await USER.findById(userId).select('profilePhotos');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      status: true,
      photos: user.profilePhotos,
    });
    return;
  } catch (error) {
    return next(error);
  }
};

const getUserMatchesByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { pageNumber, pageSize } = parsePagination(req);

    const { matchedProfiles, totalCount, hasNext } = await matchingService.getMutualMatchesByAdmin(userId, {
      pageNumber,
      pageSize,
    });

    const apiResponse: ApiResponse<{ matches: IUser[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'User matches retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = { matches: matchedProfiles, totalCount, hasNext };

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const removeUserPhotoByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, photoIndex } = req.params;
    const result = await profileService.removeUserPhotoByAdmin(userId, Number(photoIndex));

    const apiResponse: ApiResponse<typeof result> = new ApiResponse();
    apiResponse.message = 'Photo removed successfully';
    apiResponse.statusCode = 200;
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const removeAllUserPhotosByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const result = await profileService.removeAllUserPhotosByAdmin(userId);

    const apiResponse: ApiResponse<typeof result> = new ApiResponse();
    apiResponse.message = 'All photos removed successfully';
    apiResponse.statusCode = 200;
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const addNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;

    if (!adminId) throw new Error('Admin not authenticated');

    const { userId, notes } = req.body;

    if (!userId || !notes) {
      const apiResponse = new ApiResponse<null>();
      apiResponse.statusCode = 400;
      apiResponse.message = 'User ID and notes are required';
      res.status(400).json(apiResponse);
      return;
    }

    const updatedUser = await profileService.addUserNote(userId, notes, adminId);

    if (!updatedUser) {
      const apiResponse = new ApiResponse<null>();
      apiResponse.statusCode = 404;
      apiResponse.message = 'User not found';
      res.status(404).json(apiResponse);
      return;
    }

    const apiResponse = new ApiResponse<{ notes: { note: string; addedBy: string | null; createdAt: Date }[]; updatedAt: Date | null }>();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Notes added/updated successfully!';
    apiResponse.data = {
      notes: updatedUser.notes.map((n) => ({
        note: n.note,
        addedBy: n.addedBy?.toString() || null,
        createdAt: n.createdAt,
      })),
      updatedAt: updatedUser.updatedAt,
    };

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

interface NoteItem {
  note: string;
  addedBy: string | Types.ObjectId | null;
  createdAt: Date;
}

const getUserNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      const apiResponse = new ApiResponse<null>();
      apiResponse.statusCode = 400;
      apiResponse.message = 'User ID is required';
      res.status(400).json(apiResponse);
      return;
    }

    const userNotes = await profileService.fetchUserNotes(userId);

    if (!userNotes) {
      const apiResponse = new ApiResponse<null>();
      apiResponse.statusCode = 404;
      apiResponse.message = 'User not found';
      res.status(404).json(apiResponse);
      return;
    }

    const apiResponse = new ApiResponse<{ notes: NoteItem[]; updatedAt: Date | null }>();
    apiResponse.statusCode = 200;
    apiResponse.message = 'User notes fetched successfully!';
    apiResponse.data = userNotes;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const resetUserPreferenceFilter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    const { resetFilter, isSubscribed } = await profileService.resetUserSearchFilter(userId);

    const apiResponse: ApiResponse<{ resetFilter: IUserSearchFilter | null; isSubscribed: boolean }> = new ApiResponse();

    apiResponse.message = 'User search filter reset successfully';
    apiResponse.data = { resetFilter, isSubscribed };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

export default {
  getProfile,
  updateProfile,
  getAllProfilesUsers,
  getProfileDetails,
  uploadImages,
  setAudioVidioPerMin,
  //setAudioVidioPerMinSubscribedUsers,
  changeOnlineStatus,
  getNearestProfiles,
  getOtherProfileDetails,
  addToCoinBalance,
  deleteProfileUser,
  saveRecentPassUsers,
  listRecentPassUsers,
  getSearchFilter,
  updateUserPreferenceFilter,
  getAllProfilesAdmin,
  getAllFemaleUsers,
  getAllMaleUsers,
  getUserPhotos,
  getUserMatchesByAdmin,
  removeUserPhotoByAdmin,
  //getOtherUserSearchFilter,
  removeAllUserPhotosByAdmin,
  addNotes,
  getUserNotes,
  resetUserPreferenceFilter,
};
