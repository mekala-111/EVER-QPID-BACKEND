import USER from '../models/user/user';
import clanRepository from '../repositories/clan-repository';
import { Types } from 'mongoose';

const execute = async ({ clanType, lng, lat }: any) => {
  const locationFieldMap: any = {
    home: 'homeLocation',
    work: 'workLocation',
    study: 'studyLocation',
    quest: 'questLocations',
  };

  const field = locationFieldMap[clanType];

  if (!field) {
    throw new Error('Invalid clan type');
  }

  return await clanRepository.findNearbyByClan(field, lng, lat);
};

const executeClan = async (filters: any) => {
  return await clanRepository.fetchClanUsers(filters);
};

interface FetchMostActiveParams {
  userId: string;
  lat: number;
  lng: number;
}

const fetchClanProfilesMostActive = async ({ userId, lat, lng }: FetchMostActiveParams) => {
  const currentUser = await USER.findById(userId).select('subscribedPlanStatus gender');
  if (!currentUser) throw new Error('User not found');

  const isSubscribed = currentUser.gender === 'Women' ? true : currentUser.subscribedPlanStatus === 'Active';

  const locationFields = ['homeLocation', 'workLocation', 'studyLocation', 'questLocation'];
  const activityFields = ['clanActivity.home', 'clanActivity.work', 'clanActivity.study', 'clanActivity.quest'];

  const results: any[] = [];

  for (let i = 0; i < locationFields.length; i++) {
    const locField = locationFields[i];
    const actField = activityFields[i];

    const geoQuery: any = {
      _id: { $ne: new Types.ObjectId(userId) },
    };

    if (locField === 'questLocation') {
      geoQuery[locField + '.coordinates.0'] = { $exists: true };
    } else {
      geoQuery[locField] = { $exists: true };
    }

    const profiles = await USER.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: 50000,
          spherical: true,
          query: geoQuery,
          key: locField,
        },
      },
      {
        $sort: { [actField]: -1 },
      },
      { $limit: 20 },
    ]);

    results.push(...profiles);
  }

  const mergedProfiles = Array.from(new Map(results.map((p) => [p._id.toString(), p])).values());

  mergedProfiles.sort((a, b) => {
    const aActivity = a.clanActivity || {};
    const bActivity = b.clanActivity || {};

    const aLast = Math.max(
      aActivity.home ? new Date(aActivity.home).getTime() : 0,
      aActivity.work ? new Date(aActivity.work).getTime() : 0,
      aActivity.study ? new Date(aActivity.study).getTime() : 0,
      aActivity.quest ? new Date(aActivity.quest).getTime() : 0,
    );

    const bLast = Math.max(
      bActivity.home ? new Date(bActivity.home).getTime() : 0,
      bActivity.work ? new Date(bActivity.work).getTime() : 0,
      bActivity.study ? new Date(bActivity.study).getTime() : 0,
      bActivity.quest ? new Date(bActivity.quest).getTime() : 0,
    );

    return bLast - aLast;
  });

  return { isSubscribed, users: mergedProfiles.slice(0, 20) };
};

interface FetchClanProfilesPhotosParams {
  clanType: 'home' | 'work' | 'study' | 'quest';
  userId: string;
  lat: number;
  lng: number;
}

const fetchClanProfilesPhotos = async (params: FetchClanProfilesPhotosParams) => {
  const profiles = await clanRepository.fetchClanProfilesPhotos(params);
  return profiles;
};

interface FetchByLocationParams {
  userId: string;
  targetCity: string;
  clanType?: 'home' | 'work' | 'study' | 'quest';
  pageNumber: number;
  pageSize: number;
}

const fetchClanProfilesByLocation = async (params: FetchByLocationParams) => {
  return await clanRepository.getClanProfilesByLocation(params);
};

export default { execute, executeClan, fetchClanProfilesMostActive, fetchClanProfilesPhotos, fetchClanProfilesByLocation };
