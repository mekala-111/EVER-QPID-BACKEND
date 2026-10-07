import UserEntity from '../entities/user-entity';
import userRepository from '../repositories/user-repository';
import { PipelineStage, Types } from 'mongoose';
import { validateNotFound, validateUserAuthorization } from '../utils/validators';
import ERROR from '../middlewares/web_server/http-error';
import { AlcoholConsumption, IUser, SmokingHabit, WorkoutFrequency, ZodiacSign } from '../models/user/user-model';
import USER from '../models/user/user';
import MATCHING from '../models/matching/matching';
import CHATSMESSAGES from '../models/chatMessage/chatMessage';
import { IEmployee } from '../models/employee/employee-model';
import hostRepository from '../repositories/host-repository';

const createHostProfile = async (obj: any, assignedEmployeeId: string, adminId: string) => {
  const location = { type: 'Point', coordinates: [obj.lng || 0, obj.lat || 0] };
  const homeLocation = { type: 'Point', coordinates: [0, 0] };
  const workLocation = { type: 'Point', coordinates: [0, 0] };
  const studyLocation = { type: 'Point', coordinates: [0, 0] };
  const questLocations: any[] = [];

  const userEntity = new UserEntity(
    true,
    obj.fullName,
    obj.email || '',
    obj.countryCode || '+91',
    obj.mobileNumber,
    obj.profileImageUrl || '',
    obj.gender,
    ZodiacSign.None,
    obj.alcoholConsumption ?? AlcoholConsumption.None,
    obj.smokingHabit ?? SmokingHabit.None,
    obj.workoutFrequency ?? WorkoutFrequency.None,
    obj.dateOfBirth || '',
    obj.aboutMe || '',
    location,
    homeLocation,
    workLocation,
    studyLocation,
    questLocations,
    obj.locationString || '',
    obj.lat || 0,
    obj.lng || 0,
    obj.relationshipGoals || [],
    obj.relationshipStatus || '',
    obj.religion || '',
    obj.height || null,
    obj.otherLanguages || [],
    obj.interests || [],
    obj.currentProfession || '',
    obj.companyName || '',
    obj.roleInCompany || '',
    obj.employmentType || '',
    obj.education || '',
    obj.collegeName || '',
    obj.graduationYear || 0,
    obj.currentlyStudying || false,
    obj.profilePhotos || [],
    'host',
    'Active',
    [],
    {
      home: null,
      work: null,
      study: null,
      quest: null,
    },
    true,
    new Types.ObjectId(assignedEmployeeId),
    new Types.ObjectId(adminId),
    null,
    new Date(),
    null,
    null,
    true,
    false,
    0,
    '',
    '',
    '',
    '',
    false,
    [],
    false,
    false,
  );

  userEntity.isHostProfile = true;
  userEntity.assignedEmployee = new Types.ObjectId(assignedEmployeeId);
  userEntity.createdByAdmin = new Types.ObjectId(adminId);

  return await userRepository.createNewUser(userEntity);
};

const updateHostProfile = async (hostId: string, obj: any, assignedEmployeeId: string, adminId: string): Promise<IUser> => {
  validateUserAuthorization(adminId);
  if (!hostId) throw new ERROR.BadRequestError('Host ID is required');

  const host = await userRepository.getUserById(hostId);
  validateNotFound(host, 'Host not found');

  if (obj.fullName) host.fullName = obj.fullName;
  if (obj.email) host.email = obj.email;
  if (obj.countryCode) host.countryCode = obj.countryCode;
  if (obj.mobileNumber) host.mobileNumber = obj.mobileNumber;
  if (obj.profileImageUrl) host.profileImageUrl = obj.profileImageUrl;
  if (obj.gender) host.gender = obj.gender;
  if (obj.zodiacSign) host.zodiacSign = obj.zodiacSign;
  if (obj.alcoholConsumption) host.alcoholConsumption = obj.alcoholConsumption;
  if (obj.smokingHabit) host.smokingHabit = obj.smokingHabit;
  if (obj.workoutFrequency) host.workoutFrequency = obj.workoutFrequency;
  if (obj.dateOfBirth) host.dateOfBirth = obj.dateOfBirth;
  if (obj.aboutMe) host.aboutMe = obj.aboutMe;
  if (obj.locationString) host.locationString = obj.locationString;
  if (obj.lat && obj.lng) host.location = { type: 'Point', coordinates: [obj.lng, obj.lat] };
  if (obj.relationshipGoals) host.relationshipGoals = obj.relationshipGoals;
  if (obj.relationshipStatus) host.relationshipStatus = obj.relationshipStatus;
  if (obj.religion) host.religion = obj.religion;
  if (obj.height) host.height = obj.height;
  if (obj.otherLanguages) host.otherLanguages = obj.otherLanguages;
  if (obj.interests) host.interests = obj.interests;
  if (obj.currentProfession) host.currentProfession = obj.currentProfession;
  if (obj.companyName) host.companyName = obj.companyName;
  if (obj.roleInCompany) host.roleInCompany = obj.roleInCompany;
  if (obj.employmentType) host.employmentType = obj.employmentType;
  if (obj.education) host.education = obj.education;
  if (obj.collegeName) host.collegeName = obj.collegeName;
  if (obj.graduationYear) host.graduationYear = obj.graduationYear;
  if (obj.currentlyStudying !== undefined) host.currentlyStudying = obj.currentlyStudying;
  if (obj.profilePhotos) host.profilePhotos = obj.profilePhotos;

  // Host-specific fields
  host.isHostProfile = true;
  host.assignedEmployee = new Types.ObjectId(assignedEmployeeId);
  host.updatedUser = new Types.ObjectId(adminId);
  host.updatedAt = new Date();

  return await userRepository.updateUser(host);
};

interface GetHostsOptions {
  pageNumber: number;
  pageSize: number;
  search?: string;
  status?: 'Active' | 'Inactive';
  assignedEmployeeId?: string;
}

interface GetHostsResult {
  hosts: IUser[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  hasNext: boolean;
}

const getAllHosts = async ({
  pageNumber,
  pageSize,
  search,
  status,
  assignedEmployeeId,
  startDate,
  endDate,
}: GetHostsOptions & { startDate?: string; endDate?: string }): Promise<GetHostsResult> => {
  const baseFilter: any = { isHostProfile: true, isActive: true };
  console.log('FINAL BASE FILTER:', JSON.stringify(baseFilter, null, 2));

  if (search) {
    baseFilter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }

  if (assignedEmployeeId) {
    baseFilter.assignedEmployee = Types.ObjectId.isValid(assignedEmployeeId) ? new Types.ObjectId(assignedEmployeeId) : null;
  }

  if (status === 'Active') baseFilter.isActive = true;
  else if (status === 'Inactive') baseFilter.isActive = false;

  if (startDate || endDate) {
    baseFilter.createdAt = {};
    if (startDate) baseFilter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) baseFilter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  const totalCount = await USER.countDocuments(baseFilter);

  if (totalCount === 0) {
    return {
      hosts: [],
      totalCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      hasNext: false,
    };
  }

  const pipeline: any[] = [
    { $match: baseFilter },
    {
      $lookup: {
        from: 'cln_user',
        localField: 'assignedEmployee',
        foreignField: '_id',
        as: 'assignedEmployeeInfo',
      },
    },
    { $unwind: { path: '$assignedEmployeeInfo', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        age: {
          $floor: {
            $divide: [{ $subtract: [new Date(), { $toDate: '$dateOfBirth' }] }, 1000 * 60 * 60 * 24 * 365],
          },
        },
        assignedEmployeeName: '$assignedEmployeeInfo.name',
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },
    {
      $project: {
        __v: 0,
        assignedEmployeeInfo: 0,
        updatedUser: 0,
        createdByAdmin: 0,
      },
    },
  ];

  const hosts = await USER.aggregate(pipeline);

  const countBaseFilter = {
    isHostProfile: true,
    ...(search && {
      $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
    }),
    ...(assignedEmployeeId && {
      assignedEmployee: new Types.ObjectId(assignedEmployeeId),
    }),
  };

  const activeCount = await USER.countDocuments({ ...countBaseFilter, isActive: true });
  const inactiveCount = await USER.countDocuments({ ...countBaseFilter, isActive: false });

  const hasNext = totalCount > pageNumber * pageSize;

  return { hosts, totalCount, activeCount, inactiveCount, hasNext };
};

interface IUserWithEmployee {
  _id: Types.ObjectId;
  fullName: string;
  mobileNumber: string;
  email: string;
  assignedEmployee?: Pick<IEmployee, 'name'> | null;
  createdAt: Date;
  lastActive: Date | null;
  isVerified: boolean;
  subscribedPlanStatus: string;
  isActive: boolean;
  [key: string]: any;
}

const getHostDetails = async ({ hostId }: { hostId: string }) => {
  if (!Types.ObjectId.isValid(hostId)) return null;

  const host = await USER.findById(hostId).populate<{ assignedEmployee?: IEmployee }>('assignedEmployee', 'name').lean<IUserWithEmployee>();

  if (!host) return null;

  const hostObjectId = new Types.ObjectId(hostId);

  const totalMatchesAgg = await MATCHING.aggregate([
    {
      $match: {
        documentStatus: true,
        $or: [{ fromUserId: hostObjectId }, { toUserId: hostObjectId }],
      },
    },
    {
      $project: {
        otherUserId: {
          $cond: [{ $eq: ['$fromUserId', hostObjectId] }, '$toUserId', '$fromUserId'],
        },
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
                $and: [{ $eq: ['$fromUserId', '$$otherUserId'] }, { $eq: ['$toUserId', hostObjectId] }, { $eq: ['$documentStatus', true] }],
              },
            },
          },
        ],
        as: 'reverseLike',
      },
    },
    { $match: { reverseLike: { $ne: [] } } },
    { $group: { _id: '$otherUserId' } },
    { $count: 'totalMatches' },
  ]);

  const totalMatches = totalMatchesAgg[0]?.totalMatches || 0;

  const totalChats = await CHATSMESSAGES.countDocuments({
    $or: [{ senderId: host._id }, { receiverId: host._id }],
  });

  const lastChat = await CHATSMESSAGES.findOne({
    $or: [{ senderId: host._id }, { receiverId: host._id }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const sideProfileDetails = {
    fullName: host.fullName,
    joinedDate: host.createdAt,
    lastActive: host.lastActive,
    phoneNo: host.mobileNumber,
    email: host.email,
    assignedEmployeeName: host.assignedEmployee?.name || null,
    status: host.isActive ? 'active' : 'inactive',
    isVerified: host.isVerified,
    isSubscribed: host.subscribedPlanStatus === 'Active',
    totalMatches,
    totalChats,
    lastChatOn: lastChat?.createdAt || null,
    totalSpend: 0,
    openTickets: 0,
  };

  return {
    userProfile: host,
    sideProfileDetails,
  };
};

const deleteHost = async (hostId: string, adminId: string) => {
  if (!hostId) throw new ERROR.BadRequestError('Host ID is required');
  if (!Types.ObjectId.isValid(hostId)) throw new ERROR.BadRequestError('Invalid Host ID');

  const host = await USER.findById(hostId);
  if (!host || host.userType !== 'host') throw new ERROR.NotFoundError('Host not found');

  host.isActive = false;
  host.updatedUser = new Types.ObjectId(adminId);
  host.updatedAt = new Date();

  await host.save();

  return host;
};

const getHostPhotos = async (hostId: string) => {
  if (!Types.ObjectId.isValid(hostId)) return null;

  const host = await USER.findById(hostId).select('profilePhotos fullName').exec();

  return host;
};

interface GetHostMatchesOptions {
  hostId: string;
  pageNumber: number;
  pageSize: number;
}

interface HostMatchResponse {
  _id: Types.ObjectId;
  matchedAt: Date;
  user: {
    _id: string;
    fullName: string;
    gender: string;
  };
}

const getHostMatching = async ({
  hostId,
  pageNumber,
  pageSize,
}: GetHostMatchesOptions): Promise<{
  matches: HostMatchResponse[];
  totalCount: number;
  hasNext: boolean;
}> => {
  const hostObjectId = new Types.ObjectId(hostId);

  const matchingDocs = await MATCHING.find({
    $or: [{ fromUserId: hostObjectId }, { toUserId: hostObjectId }],
    documentStatus: true,
  })
    .populate('fromUserId toUserId', 'fullName gender')
    .sort({ createdAt: -1 })
    .exec();

  const matches: HostMatchResponse[] = [];
  const seenUserIds = new Set<string>();

  for (const doc of matchingDocs) {
    const fromUser = doc.fromUserId as unknown as IUser;
    const toUser = doc.toUserId as unknown as IUser;

    const otherUser = fromUser._id.toString() === hostId ? toUser : fromUser;

    if (!seenUserIds.has(otherUser._id.toString())) {
      matches.push({
        _id: doc._id,
        matchedAt: doc.createdAt ?? new Date(),
        user: {
          _id: otherUser._id.toString(),
          fullName: otherUser.fullName,
          gender: otherUser.gender,
        },
      });
      seenUserIds.add(otherUser._id.toString());
    }
  }

  const totalCount = matches.length;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMatches = matches.slice(startIndex, endIndex);
  const hasNext = endIndex < totalCount;

  return {
    matches: paginatedMatches,
    totalCount,
    hasNext,
  };
};

interface GetHostSentLikesOptions {
  hostId: string;
  pageNumber?: number;
  pageSize?: number;
}

const getHostSentLikes = async ({
  hostId,
  pageNumber = 1,
  pageSize = 10,
}: GetHostSentLikesOptions): Promise<{
  sentLikes: IUser[];
  totalCount: number;
  hasNext: boolean;
}> => {
  const filter = { fromUserId: hostId };

  const totalCount = await MATCHING.countDocuments(filter);

  const matchingDocs = await MATCHING.find(filter)
    .populate('toUserId', 'fullName profileImageUrl email mobileNumber') // populate recipient info
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .sort({ createdAt: -1 })
    .exec();

  const sentLikes: IUser[] = matchingDocs.map((doc) => doc.toUserId as unknown as IUser);

  const hasNext = totalCount > pageNumber * pageSize;

  return { sentLikes, totalCount, hasNext };
};

interface SendLikeOptions {
  hostId: string;
  toUserId: string;
}

const sendLike = async ({ hostId, toUserId }: SendLikeOptions) => {
  const existingLike = await MATCHING.findOne({ fromUserId: hostId, toUserId });
  if (existingLike) {
    return { message: 'Like already sent', alreadySent: true };
  }

  const like = new MATCHING({
    fromUserId: hostId,
    toUserId,
  });

  await like.save();

  return { message: 'Like sent successfully', alreadySent: false, likeId: like._id };
};

interface GetUsersForHostOptions {
  pageNumber?: number;
  pageSize?: number;
}

const getUsersForHost = async ({
  pageNumber = 1,
  pageSize = 10,
}: GetUsersForHostOptions): Promise<{
  users: Partial<IUser>[];
  totalCount: number;
  hasNext: boolean;
}> => {
  const filter = { isHostProfile: false, isActive: true };

  const totalCount = await USER.countDocuments(filter);

  const users = await USER.find(filter, 'fullName dateOfBirth education profileImgUrl') // only required fields
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .sort({ createdAt: -1 })
    .exec();

  const usersWithAge = users.map((u) => ({
    _id: u._id,
    fullName: u.fullName,
    education: u.education,
    age: u.dateOfBirth ? Math.floor((new Date().getTime() - new Date(u.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null,
  }));

  const hasNext = totalCount > pageNumber * pageSize;

  return { users: usersWithAge, totalCount, hasNext };
};

const getHostRecentChats = async ({
  employeeId,
  hostId,
  pageNumber,
  pageSize,
}: {
  employeeId: string;
  hostId: string;
  pageNumber: number;
  pageSize: number;
}): Promise<{ chats: any[]; totalCount: number; hasNext: boolean }> => {
  return await hostRepository.getHostRecentChats({
    employeeId,
    hostId,
    pageNumber,
    pageSize,
  });
};

const getHostRecentChatsListService = async ({
  employeeId,
  hostId,
  pageNumber,
  pageSize,
  locationString,
  otherLanguages,
}: {
  employeeId: string;
  hostId: string;
  pageNumber: number;
  pageSize: number;
  locationString?: string;
  otherLanguages?: string[];
}) => {
  const hostObjectId = new Types.ObjectId(hostId);
  const employeeObjectId = new Types.ObjectId(employeeId);

  const host = await USER.findOne({
    _id: hostObjectId,
    assignedEmployee: employeeObjectId,
    isHostProfile: true,
    documentStatus: true,
  }).lean();

  const hostCheck = await USER.findById(hostObjectId).lean();
  console.log('hostCheck:', hostCheck);
  console.log('assignedEmployee type:', hostCheck?.assignedEmployee?.toString());
  console.log('employeeId type:', typeof employeeId);
  console.log('employeeId == assignedEmployee?', hostCheck?.assignedEmployee?.toString() === employeeId);

  if (!host) {
    throw new Error('Host is not assigned to this employee');
  }

  return hostRepository.getHostRecentChatsList(host._id, { locationString, otherLanguages }, pageNumber, pageSize);
};

const markHostConversationReadService = async (hostId: string, userId: string) => {
  return await hostRepository.markMessagesAsRead(hostId, userId);
};

const fetchRecentChats = async ({
  hostId,
  pageNumber,
  pageSize,
  locationString,
  otherLanguages,
}: {
  hostId: string;
  pageNumber: number;
  pageSize: number;
  locationString?: string;
  otherLanguages?: string[];
}) => {
  const hostObjectId = new Types.ObjectId(hostId);

  const host = await USER.findOne({
    _id: hostObjectId,
    isHostProfile: true,
    documentStatus: true,
  }).lean();

  const hostCheck = await USER.findById(hostObjectId).lean();
  console.log('hostCheck:', hostCheck);

  if (!host) {
    throw new Error('Host is not assigned to this employee');
  }

  return hostRepository.getHostRecentChatsListEmployee(host._id, { locationString, otherLanguages }, pageNumber, pageSize);
};

interface GetUsersForHostOptionsEmployee {
  hostId: string;
  pageNumber?: number;
  pageSize?: number;
}

const getUsersForHostByEmployee = async ({ hostId, pageNumber = 1, pageSize = 10 }: GetUsersForHostOptionsEmployee) => {
  const skip = (pageNumber - 1) * pageSize;

  const pipeline: PipelineStage[] = [
    {
      $match: {
        isHostProfile: false,
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'cln_matchings',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$toUserId', '$$userId'] }, { $eq: ['$fromUserId', new Types.ObjectId(hostId)] }],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'likeInfo',
      },
    },
    {
      $addFields: {
        isLiked: { $gt: [{ $size: '$likeInfo' }, 0] },
        age: {
          $floor: {
            $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 1000 * 60 * 60 * 24 * 365],
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        education: 1,
        age: 1,
        isLiked: 1,
      },
    },
    { $sort: { createdAt: -1 as 1 | -1 } },
    { $skip: skip },
    { $limit: pageSize },
  ];

  const users = await USER.aggregate(pipeline);

  const totalCount = await USER.countDocuments({
    isHostProfile: false,
    isActive: true,
  });

  const hasNext = totalCount > pageNumber * pageSize;

  return { users, totalCount, hasNext };
};

interface GetHostsByEmployeeOptions {
  employeeId: string;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: 'Active' | 'Inactive';
  startDate?: string;
  endDate?: string;
}

interface GetHostsByEmployeeResult {
  hosts: IUser[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  hasNext: boolean;
}

const getHostsByEmployee = async ({
  employeeId,
  pageNumber = 1,
  pageSize = 10,
  search,
  status,
  startDate,
  endDate,
}: GetHostsByEmployeeOptions): Promise<GetHostsByEmployeeResult> => {
  if (!Types.ObjectId.isValid(employeeId)) {
    throw new Error('Invalid employeeId');
  }

  const baseFilter: any = {
    isHostProfile: true,
    assignedEmployee: new Types.ObjectId(employeeId),
  };

  if (search) {
    baseFilter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }

  if (status === 'Active') baseFilter.isActive = true;
  else if (status === 'Inactive') baseFilter.isActive = false;

  if (startDate || endDate) {
    baseFilter.createdAt = {};
    if (startDate) baseFilter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) baseFilter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  const totalCount = await USER.countDocuments(baseFilter);
  if (totalCount === 0) {
    return { hosts: [], totalCount: 0, activeCount: 0, inactiveCount: 0, hasNext: false };
  }

  const pipeline: PipelineStage[] = [
    { $match: baseFilter },
    {
      $lookup: {
        from: 'cln_user',
        localField: 'assignedEmployee',
        foreignField: '_id',
        as: 'assignedEmployeeInfo',
      },
    },
    { $unwind: { path: '$assignedEmployeeInfo', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        age: {
          $floor: {
            $divide: [{ $subtract: [new Date(), { $toDate: '$dateOfBirth' }] }, 1000 * 60 * 60 * 24 * 365],
          },
        },
        assignedEmployeeName: '$assignedEmployeeInfo.name',
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },
    {
      $project: {
        __v: 0,
        assignedEmployeeInfo: 0,
        updatedUser: 0,
        createdByAdmin: 0,
      },
    },
  ];

  const hosts = await USER.aggregate(pipeline);

  const activeCount = await USER.countDocuments({ ...baseFilter, isActive: true });
  const inactiveCount = await USER.countDocuments({ ...baseFilter, isActive: false });
  const hasNext = totalCount > pageNumber * pageSize;

  return { hosts, totalCount, activeCount, inactiveCount, hasNext };
};

export default {
  createHostProfile,
  updateHostProfile,
  getAllHosts,
  deleteHost,
  getHostDetails,
  getHostPhotos,
  getHostMatching,
  getHostSentLikes,
  sendLike,
  getUsersForHost,
  getHostRecentChats,
  getHostRecentChatsListService,
  markHostConversationReadService,
  fetchRecentChats,
  getUsersForHostByEmployee,
  getHostsByEmployee,
};
