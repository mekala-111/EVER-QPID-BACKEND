import { Request, Response, NextFunction } from 'express';
import { matchingService } from '../services';
import ApiResponse from '../utils/api-response';
import { IMatching } from '../models/matching/matching-model';
import { IUser } from '../models/user/user-model';
import { parsePagination } from '../utils/pagination';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}
/**
 * Like a profile (this will create a potential match)
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const likeProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, toUserId } = req.body;
    const match = await matchingService.createMatch(userId, toUserId);

    const apiResponse: ApiResponse<{ match: IMatching | null }> = new ApiResponse<{ match: IMatching | null }>();
    apiResponse.message = 'Profile liked successfully! Potential match created.';
    apiResponse.statusCode = 200;
    apiResponse.data = { match };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * unLike a profile
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const unLikeProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const fromUserId = userId;
    const toUserId = req.params.userId;

    await matchingService.removeMatch(fromUserId, toUserId);

    const apiResponse = new ApiResponse<null>();
    apiResponse.message = 'Profile unliked successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = null;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Controller: Get all mutual matches for a user
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getMutualMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { pageNumber, pageSize } = parsePagination(req);

    const { matchedProfiles, totalCount, hasNext } = await matchingService.getMutualMatches(userId, {
      pageNumber,
      pageSize,
    });

    const apiResponse: ApiResponse<{ matches: IUser[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'User matches retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = { matches: matchedProfiles, totalCount, hasNext };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all profiles that a user liked
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getUserLikedProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { pageNumber, pageSize } = parsePagination(req);

    const filters = {
      maxDistance: req.query.maxDistance ? parseInt(req.query.maxDistance as string) : undefined,
      allowOutOfDistance: req.query.allowOutOfDistance === 'true',
      minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
      allowOutOfAgeRange: req.query.allowOutOfAgeRange === 'true',
      interestedIn: req.query.interestedIn as string,
      hasBio: req.query.hasBio === 'true',
      minPhotos: req.query.minPhotos ? parseInt(req.query.minPhotos as string) : undefined,
      lookingFor: req.query.lookingFor as string,
      openTo: req.query.openTo as string,
      languages: req.query.languages ? (req.query.languages as string).split(',') : [],
      zodiacSign: req.query.zodiacSign as string,
      education: req.query.education as string,
      familyPlans: req.query.familyPlans as string,
      covidVaccine: req.query.covidVaccine as string,
      personalityType: req.query.personalityType as string,
      loveStyle: req.query.loveStyle as string,
      petOwnership: req.query.petOwnership as string,
      drinking: req.query.drinking as string,
      smoking: req.query.smoking as string,
      workout: req.query.workout as string,
      dietaryPreference: req.query.dietaryPreference as string,
      socialMedia: req.query.socialMedia as string,
      sleepingHabits: req.query.sleepingHabits as string,
    };

    const { likedProfiles, totalCount, hasNext } = await matchingService.getUserLikedProfiles(
      userId,
      {
        pageNumber,
        pageSize,
      },
      filters,
    );

    const apiResponse: ApiResponse<{ likedProfiles: IUser[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'User liked profiles retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = { likedProfiles, hasNext, totalCount };
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all profiles that a user liked
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getReceivedLikes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { pageNumber, pageSize } = parsePagination(req);
    //Extract filters from query or body (choose one based on frontend)
    const filters = {
      maxDistance: req.query.maxDistance ? parseInt(req.query.maxDistance as string) : undefined,
      allowOutOfDistance: req.query.allowOutOfDistance === 'true',
      minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
      allowOutOfAgeRange: req.query.allowOutOfAgeRange === 'true',
      interestedIn: req.query.interestedIn as string,
      hasBio: req.query.hasBio === 'true',
      minPhotos: req.query.minPhotos ? parseInt(req.query.minPhotos as string) : undefined,
      lookingFor: req.query.lookingFor as string,
      openTo: req.query.openTo as string,
      languages: req.query.languages ? (req.query.languages as string).split(',') : [],
      zodiacSign: req.query.zodiacSign as string,
      education: req.query.education as string,
      familyPlans: req.query.familyPlans as string,
      covidVaccine: req.query.covidVaccine as string,
      personalityType: req.query.personalityType as string,
      loveStyle: req.query.loveStyle as string,
      petOwnership: req.query.petOwnership as string,
      drinking: req.query.drinking as string,
      smoking: req.query.smoking as string,
      workout: req.query.workout as string,
      dietaryPreference: req.query.dietaryPreference as string,
      socialMedia: req.query.socialMedia as string,
      sleepingHabits: req.query.sleepingHabits as string,
    };
    const { receivedProfiles, totalCount, hasNext, isSubscribed } = await matchingService.getReceivedLikes(
      userId,
      {
        pageNumber,
        pageSize,
      },
      filters,
    );

    const apiResponse: ApiResponse<{ receivedProfiles: IUser[]; hasNext: boolean; totalCount: number; isSubscribed: boolean }> = new ApiResponse();
    apiResponse.message = 'Received likes retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = { receivedProfiles, hasNext, totalCount, isSubscribed };
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get all matches across the platform (admin view)
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getAllMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageNumber, pageSize } = parsePagination(req);

    const { data, totalCount, hasNext } = await matchingService.getAllMatches({
      pageNumber,
      pageSize,
    });

    const apiResponse: ApiResponse<{ data: IMatching[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'All matches retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = { data, totalCount, hasNext };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};
/**
 * Get matches for a specific user (admin view)
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getUserMatchesAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { pageNumber, pageSize } = parsePagination(req);
    const { data, totalCount, hasNext } = await matchingService.getUserMatchesAdmin(userId, {
      pageNumber,
      pageSize,
    });

    const apiResponse: ApiResponse<{ data: IMatching[]; hasNext: boolean; totalCount: number }> = new ApiResponse();
    apiResponse.message = 'User matches retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = { data, totalCount, hasNext };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Get match statistics (admin view)
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getMatchStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await matchingService.getMatchStats();

    const apiResponse: ApiResponse<any> = new ApiResponse();
    apiResponse.message = 'Match statistics retrieved successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = stats;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const superLikeProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, toUserId } = req.body;
    const match = await matchingService.createSuperLikeMatch(userId, toUserId);

    const apiResponse: ApiResponse<{ match: IMatching | null }> = new ApiResponse<{ match: IMatching | null }>();
    apiResponse.message = 'Profile super liked successfully! Potential match created.';
    apiResponse.statusCode = 200;
    apiResponse.data = { match };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getReceivedLikesForHost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employeeId = req.user!.id;
    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    const { hostId } = req.params;

    const likes = await matchingService.getReceivedLikesForHost(employeeId, hostId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Host received likes fetched successfully';
    apiResponse.data = { likes };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const likeBackFromHost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employeeId = req.user!.id;
    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    const { hostId } = req.params;
    const { toUserId } = req.body;

    const match = await matchingService.likeBackFromHost(employeeId, hostId, toUserId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Like sent successfully';
    apiResponse.data = { match };

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

export default {
  likeProfile,
  unLikeProfile,
  getMutualMatches,
  getUserLikedProfiles,
  getAllMatches,
  getUserMatchesAdmin,
  getMatchStats,
  getReceivedLikes,
  superLikeProfile,
  getReceivedLikesForHost,
  likeBackFromHost,
};
