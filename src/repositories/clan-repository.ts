import USER from '../models/user/user';
import { Types } from 'mongoose';
import { IUser } from '../models/user/user-model';

const findNearbyByClan = async (field: string, lng: number, lat: number) => {
  return await USER.find({
    [field]: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: 50000,
      },
    },
  })
    .select('fullName profileImageUrl gender dateOfBirth relationshipStatus interests')
    .exec();
};

const fetchClanUsers = async ({ pageNumber = 1, pageSize = 10, search, status, gender, clanType, state, city, fromDate, toDate }: any) => {
  const skip = (pageNumber - 1) * pageSize;

  const match: any = {
    documentStatus: true,

    $or: [
      { 'homeLocation.coordinates': { $ne: [0, 0] } },
      { 'workLocation.coordinates': { $ne: [0, 0] } },
      { 'studyLocation.coordinates': { $ne: [0, 0] } },
      { questLocations: { $exists: true, $ne: [] } },
    ],
  };

  if (search && search.trim()) {
    match.$and = [
      {
        $or: [{ fullName: { $regex: search, $options: 'i' } }, { mobileNumber: { $regex: search, $options: 'i' } }],
      },
    ];
  }

  if (status === 'active') match.customerStatus = 'Active';
  if (status === 'inactive') match.customerStatus = 'Deactive';

  if (gender && gender !== 'all') match.gender = gender;

  if (clanType && clanType !== 'all') {
    if (clanType === 'home') match['homeLocation.coordinates'] = { $ne: [0, 0] };
    if (clanType === 'work') match['workLocation.coordinates'] = { $ne: [0, 0] };
    if (clanType === 'study') match['studyLocation.coordinates'] = { $ne: [0, 0] };
    if (clanType === 'quest') match.questLocations = { $exists: true, $ne: [] };
  }

  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = new Date(fromDate);
    if (toDate) match.createdAt.$lte = new Date(toDate);
  }

  if (clanType && (city || state)) {
    const locationField = clanType === 'quest' ? 'questLocations' : `${clanType}Location`;

    if (clanType === 'quest') {
      const questFilters: any = [];
      if (city) questFilters.push({ 'questLocations.city': { $regex: city, $options: 'i' } });
      if (state) questFilters.push({ 'questLocations.state': { $regex: state, $options: 'i' } });
      if (questFilters.length) match.$and = match.$and ? [...match.$and, ...questFilters] : questFilters;
    } else {
      if (city) match[`${locationField}.city`] = { $regex: city, $options: 'i' };
      if (state) match[`${locationField}.state`] = { $regex: state, $options: 'i' };
    }
  }

  const pipeline = [
    { $match: match },

    {
      $project: {
        fullName: 1,
        mobileNumber: 1,
        gender: 1,
        customerStatus: 1,
        createdAt: 1,

        clanType: {
          $switch: {
            branches: [
              { case: { $ne: ['$homeLocation.coordinates', [0, 0]] }, then: 'home' },
              { case: { $ne: ['$workLocation.coordinates', [0, 0]] }, then: 'work' },
              { case: { $ne: ['$studyLocation.coordinates', [0, 0]] }, then: 'study' },
              { case: { $gt: [{ $size: { $ifNull: ['$questLocations', []] } }, 0] }, then: 'quest' },
            ],
            default: null,
          },
        },

        location: {
          $cond: [
            { $ne: ['$homeLocation.coordinates', [0, 0]] },
            '$homeLocation',
            {
              $cond: [
                { $ne: ['$workLocation.coordinates', [0, 0]] },
                '$workLocation',
                {
                  $cond: [{ $ne: ['$studyLocation.coordinates', [0, 0]] }, '$studyLocation', { $arrayElemAt: ['$questLocations', 0] }],
                },
              ],
            },
          ],
        },

        city: {
          $switch: {
            branches: [
              { case: { $ne: ['$homeLocation.coordinates', [0, 0]] }, then: '$homeLocation.city' },
              { case: { $ne: ['$workLocation.coordinates', [0, 0]] }, then: '$workLocation.city' },
              { case: { $ne: ['$studyLocation.coordinates', [0, 0]] }, then: '$studyLocation.city' },
              { case: { $gt: [{ $size: { $ifNull: ['$questLocations', []] } }, 0] }, then: { $arrayElemAt: ['$questLocations.city', 0] } },
            ],
            default: null,
          },
        },
        state: {
          $switch: {
            branches: [
              { case: { $ne: ['$homeLocation.coordinates', [0, 0]] }, then: '$homeLocation.state' },
              { case: { $ne: ['$workLocation.coordinates', [0, 0]] }, then: '$workLocation.state' },
              { case: { $ne: ['$studyLocation.coordinates', [0, 0]] }, then: '$studyLocation.state' },
              { case: { $gt: [{ $size: { $ifNull: ['$questLocations', []] } }, 0] }, then: { $arrayElemAt: ['$questLocations.state', 0] } },
            ],
            default: null,
          },
        },
      },
    },

    { $skip: skip },
    { $limit: pageSize },
  ];

  const [users, totalCount] = await Promise.all([USER.aggregate(pipeline), USER.countDocuments(match)]);

  return {
    users,
    totalCount,
    pageNumber,
    pageSize,
    hasNext: skip + users.length < totalCount,
  };
};

interface FetchInput {
  userId: string;
  lat: number;
  lng: number;
}

export const fetchMostActiveProfilesMostActive = async ({ userId, lat, lng }: FetchInput) => {
  const activityFields = ['clanActivity.home', 'clanActivity.work', 'clanActivity.study', 'clanActivity.quest'];

  return await USER.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: 50000,
        spherical: true,
        query: { _id: { $ne: new Types.ObjectId(userId) } },
      },
    },
    {
      $addFields: {
        lastActivity: { $max: activityFields.map((f) => `$${f}`) },
      },
    },
    { $sort: { lastActivity: -1 } },
    { $limit: 20 },
  ]);
};

interface FetchClanProfilesPhotosParams {
  clanType: 'home' | 'work' | 'study' | 'quest';
  userId: string;
  lat: number;
  lng: number;
}

const fetchClanProfilesPhotos = async ({ clanType, userId, lat, lng }: FetchClanProfilesPhotosParams) => {
  const locationMap: Record<string, string> = {
    home: 'homeLocation',
    work: 'workLocation',
    study: 'studyLocation',
    quest: 'questLocations',
  };

  const activityMap: Record<string, string> = {
    home: 'clanActivity.home',
    work: 'clanActivity.work',
    study: 'clanActivity.study',
    quest: 'clanActivity.quest',
  };

  const locationField = locationMap[clanType];
  const activityField = activityMap[clanType];

  return await USER.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: 50000,
        spherical: true,
        query: {
          _id: { $ne: new Types.ObjectId(userId) },
          [locationField]: { $exists: true },
        },
        key: locationField,
      },
    },
    {
      $sort: { [activityField]: -1 },
    },
    {
      $facet: {
        profiles: [{ $project: { _id: 1, profileImageUrl: 1 } }, { $limit: 20 }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);
};

interface FetchByLocationParams {
  userId: string;
  targetCity: string;
  clanType?: 'home' | 'work' | 'study' | 'quest';
  pageNumber: number;
  pageSize: number;
}

const locationFieldMap: Record<string, string> = {
  home: 'homeLocation',
  work: 'workLocation',
  study: 'studyLocation',
  quest: 'questLocation',
};

const activityFieldMap: Record<string, string> = {
  home: 'clanActivity.home',
  work: 'clanActivity.work',
  study: 'clanActivity.study',
  quest: 'clanActivity.quest',
};

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

const getClanProfilesByLocation = async ({
  userId,
  targetCity,
  clanType,
  pageNumber,
  pageSize,
}: FetchByLocationParams): Promise<{ users: Partial<IUser>[]; totalCount: number; hasNext: boolean }> => {
  const skip = (pageNumber - 1) * pageSize;
  const typesToSearch = clanType ? [clanType] : ['home', 'work', 'study', 'quest'];

  const results: Partial<IUser>[] = [];

  for (const type of typesToSearch) {
    const locField = locationFieldMap[type];

    const query: any = {
      _id: { $ne: new Types.ObjectId(userId) },
      [`${locField}.city`]: { $regex: targetCity, $options: 'i' },
      [locField]: { $exists: true },
      documentStatus: true,
    };

    const actField = activityFieldMap[type];

    const users = await USER.find(query)
      .sort({ [actField]: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    results.push(...(users as Partial<IUser>[]));
  }

  const merged = Array.from(new Map(results.filter((p) => p._id).map((p) => [p._id!.toString(), p])).values());

  // Calculate age
  const usersWithAge = merged.map((user) => ({
    ...user,
    age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
  }));

  const hasNext = usersWithAge.length > pageSize;

  return {
    users: usersWithAge.slice(0, pageSize),
    totalCount: usersWithAge.length,
    hasNext,
  };
};

export default { findNearbyByClan, fetchClanUsers, fetchMostActiveProfilesMostActive, fetchClanProfilesPhotos, getClanProfilesByLocation };
