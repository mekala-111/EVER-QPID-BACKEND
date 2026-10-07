import { Request, Response, NextFunction } from 'express';
import { clanService } from '../services';
import USER from '../models/user/user';
import { Types } from 'mongoose';
import ApiResponse from '../utils/api-response';

const handle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body;
    const { clanType, lng, lat } = req.body;

    const result = await clanService.execute({
      userId,
      clanType,
      lng,
      lat,
    });

    res.status(200).json({
      success: true,
      profiles: result,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const updateClanLocation = async (req: Request, res: Response) => {
  try {
    const { userId, clanType, lat, lng, city, state } = req.body;

    const now = new Date();

    let updateField: any = {};

    if (clanType === 'home') {
      updateField = { homeLocation: { type: 'Point', coordinates: [lng, lat], city, state }, 'clanActivity.home': now };
    } else if (clanType === 'work') {
      updateField = { workLocation: { type: 'Point', coordinates: [lng, lat], city, state }, 'clanActivity.study': now };
    } else if (clanType === 'study') {
      updateField = { studyLocation: { type: 'Point', coordinates: [lng, lat], city, state }, 'clanActivity.work': now };
    } else if (clanType === 'quest') {
      updateField = { questLocation: { type: 'Point', coordinates: [lng, lat], city, state }, 'clanActivity.quest': now };
    } else {
      return res.status(400).json({ message: 'Invalid clan type' });
    }

    await USER.findByIdAndUpdate(userId, updateField);

    return res.status(200).json({ message: 'Clan location updated successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const fetchClanProfiles = async (req: Request, res: Response) => {
  try {
    const { clanType, lat, lng, userId } = req.body;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const currentUser = await USER.findById(userId).select('subscribedPlanStatus gender');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isSubscribed = currentUser.gender === 'Women' ? true : currentUser.subscribedPlanStatus === 'Active';

    const locationMap: any = {
      home: 'homeLocation',
      work: 'workLocation',
      study: 'studyLocation',
      quest: 'questLocation',
    };

    const activityMap: any = {
      home: 'clanActivity.home',
      work: 'clanActivity.work',
      study: 'clanActivity.study',
      quest: 'clanActivity.quest',
    };

    const locationField = locationMap[clanType];
    const activityField = activityMap[clanType];

    const results = await USER.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: 50000, // 50 km
          spherical: true,
          query: {
            _id: { $ne: new Types.ObjectId(userId) },
            [locationField]: { $exists: true },
          },
          key: locationField,
        },
      },
      {
        $sort: {
          [activityField]: -1,
        },
      },
      {
        $facet: {
          paginatedResults: [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const profiles = results[0].paginatedResults;
    const totalCount = results[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return res.status(200).json({
      profiles,
      totalCount,
      totalPages,
      currentPage: pageNumber,
      isSubscribed,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const fetchClanUsers = async (req: Request, res: Response) => {
  try {
    const filters = {
      pageNumber: Number(req.query.pageNumber) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      search: req.query.search as string,
      status: req.query.status as string,
      gender: req.query.gender as string,
      clanType: req.query.clanType as string,
      state: req.query.state as string,
      city: req.query.city as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
    };

    const result = await clanService.executeClan(filters);

    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const fetchClanProfilesMostActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng } = req.query;
    const { userId } = req.body;

    if (!lat || !lng) throw new Error('lat and lng are required');

    const profiles = await clanService.fetchClanProfilesMostActive({
      userId,
      lat: Number(lat),
      lng: Number(lng),
    });

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: profiles.users,
      isSubscribed: profiles.isSubscribed,
    });
  } catch (error) {
    next(error);
  }
};

const fetchClanProfilesPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clanType, lat, lng, userId } = req.body;

    if (!clanType || !lat || !lng || !userId) {
      res.status(400).json({ status: false, message: 'clanType, lat, lng, and userId are required' });
    }

    const profiles = await clanService.fetchClanProfilesPhotos({
      clanType,
      userId,
      lat: Number(lat),
      lng: Number(lng),
    });

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.status = true;
    apiResponse.message = 'Success';
    apiResponse.data = profiles;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const fetchClanProfilesByLocationController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const { targetCity, clanType } = req.body;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (!targetCity) {
      const apiResponse = new ApiResponse();
      apiResponse.statusCode = 400;
      apiResponse.message = 'targetCity is required';
      res.status(400).json(apiResponse);
    }

    //const userId = req.user!.id;

    const result = await clanService.fetchClanProfilesByLocation({
      userId,
      targetCity,
      clanType,
      pageNumber,
      pageSize,
    });

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Clan profiles fetched successfully';
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

export default {
  handle,
  updateClanLocation,
  fetchClanProfiles,
  fetchClanUsers,
  fetchClanProfilesMostActive,
  fetchClanProfilesPhotos,
  fetchClanProfilesByLocationController,
};
