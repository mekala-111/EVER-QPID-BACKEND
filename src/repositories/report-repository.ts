import CHATSMESSAGES from '../models/chatMessage/chatMessage';
import MATCHING from '../models/matching/matching';
import REPORT from '../models/report/report';
import SUPPORT from '../models/support/support';
import TRANSACTION from '../models/transaction/transaction';
import USER from '../models/user/user';
import { Types } from 'mongoose';

const createReport = async ({ reporter, reported, reason }: { reporter: string; reported: string; reason: string }) => {
  if (reporter === reported) {
    throw new Error('Users cannot report themselves.');
  }

  const [reporterExists, reportedExists] = await Promise.all([USER.findById(reporter), USER.findById(reported)]);

  if (!reporterExists || !reportedExists) {
    throw new Error('Invalid reporter or reported user.');
  }

  const alreadyReported = await REPORT.findOne({ reporter, reported });

  if (alreadyReported) {
    throw new Error('You already reported this user.');
  }

  return REPORT.create({ reporter, reported, reason });
};

interface GetReportsOptions {
  pageNumber: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'under_review' | 'active' | 'final_warning' | 'suspended';
}

const getAllReports = async ({ pageNumber, pageSize, search, status }: GetReportsOptions) => {
  const filters: any = { documentStatus: true };

  if (status && status !== 'all') {
    filters.status = status;
  }

  let reports = await REPORT.find(filters)
    .populate('reporter', 'fullName email')
    .populate('reported', 'fullName email')
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();

  if (search) {
    const lowerSearch = search.toLowerCase();
    reports = reports.filter(
      (r) =>
        (r.reporter as any).fullName.toLowerCase().includes(lowerSearch) ||
        (r.reported as any).fullName.toLowerCase().includes(lowerSearch) ||
        (r.reporter as any).email.toLowerCase().includes(lowerSearch) ||
        (r.reported as any).email.toLowerCase().includes(lowerSearch),
    );
  }

  const totalCount = await REPORT.countDocuments(filters);
  const hasNext = pageNumber * pageSize < totalCount;

  const totalUsers = await USER.countDocuments({ documentStatus: true });
  const activeUsers = await USER.countDocuments({ isActive: true, documentStatus: true });

  const activeMaleUsers = await USER.countDocuments({
    isActive: true,
    gender: 'Man',
    documentStatus: true,
  });

  const activeFemaleUsers = await USER.countDocuments({
    isActive: true,
    gender: 'Women',
    documentStatus: true,
  });

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newSignUps = await USER.countDocuments({ createdAt: { $gte: startOfMonth }, documentStatus: true });

  const newMaleSignUps = await USER.countDocuments({
    createdAt: { $gte: startOfMonth },
    gender: 'Man',
    documentStatus: true,
  });

  const newFemaleSignUps = await USER.countDocuments({
    createdAt: { $gte: startOfMonth },
    gender: 'Women',
    documentStatus: true,
  });

  // const reportedUsersCountAll = await REPORT.distinct('reported', {
  //   documentStatus: true,
  // }).then((users) => users.length);

  const reportedUserIds = await REPORT.distinct('reported', {
    documentStatus: true,
  });

  const reportedUsersCount = reportedUserIds.length;

  const reportedMaleAccounts = await USER.countDocuments({
    _id: { $in: reportedUserIds },
    gender: 'Man',
    documentStatus: true,
  });

  const reportedFemaleAccounts = await USER.countDocuments({
    _id: { $in: reportedUserIds },
    gender: 'Women',
    documentStatus: true,
  });

  const stats = {
    totalUsers,
    activeUsers,
    activeMaleUsers,
    activeFemaleUsers,
    newSignUps,
    newMaleSignUps,
    newFemaleSignUps,
    reportedUsersCount,
    reportedMaleAccounts,
    reportedFemaleAccounts,
  };

  return { reports, totalCount, hasNext, stats };
};

const getReportedUserDetails = async (reportedId: string) => {
  if (!Types.ObjectId.isValid(reportedId)) {
    throw new Error('Invalid reported user ID');
  }

  const reportedUser = await USER.findById(reportedId).lean();
  if (!reportedUser) {
    throw new Error('Reported user not found');
  }

  const reports = await REPORT.find({ reported: reportedId, documentStatus: true })
    .populate('reporter', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

  const totalMatches = await MATCHING.countDocuments({
    $or: [{ fromUserId: reportedId }, { toUserId: reportedId }],
    documentStatus: true,
  });

  const totalSpendAgg = await TRANSACTION.aggregate([
    { $match: { userId: new Types.ObjectId(reportedId), status: 'success' } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
  ]);
  const totalSpend = totalSpendAgg[0]?.totalAmount || 0;

  const lastChat = await CHATSMESSAGES.find({
    $or: [{ senderId: reportedId }, { receiverId: reportedId }],
    documentStatus: true,
  })
    .sort({ sentAt: -1 })
    .limit(1);

  const openTickets = await SUPPORT.countDocuments({
    userId: reportedId,
    status: 'open',
    documentStatus: true,
  });

  const isSubscribed = reportedUser.subscribedPlanStatus === 'Active';

  const sideProfileDetails = {
    fullName: reportedUser.fullName,
    joinedDate: reportedUser.createdAt,
    lastActive: reportedUser.lastActive,
    phoneNo: reportedUser.mobileNumber,
    email: reportedUser.email,
    isVerified: reportedUser.isVerified,
    isSubscribed,
    totalMatches,
    totalSpend,
    openTickets,
    lastChatOn: lastChat[0]?.sentAt || null,
  };

  return { user: reportedUser, reports, sideProfileDetails };
};

const getAllReportsDownload = async ({ pageNumber, pageSize, search, status }: GetReportsOptions) => {
  const filters: any = { documentStatus: true };

  if (status && status !== 'all') {
    filters.status = status;
  }

  filters.reporter = { $type: 'objectId' };
  filters.reported = { $type: 'objectId' };

  let reports = await REPORT.find(filters)
    .populate({ path: 'reporter', select: 'fullName email', match: { documentStatus: true } })
    .populate({ path: 'reported', select: 'fullName email', match: { documentStatus: true } })
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();

  reports = reports.filter((r) => r.reporter && r.reported);

  if (search) {
    const lowerSearch = search.toLowerCase();
    reports = reports.filter(
      (r) =>
        (r.reporter as any)?.fullName?.toLowerCase().includes(lowerSearch) ||
        (r.reported as any)?.fullName?.toLowerCase().includes(lowerSearch) ||
        (r.reporter as any)?.email?.toLowerCase().includes(lowerSearch) ||
        (r.reported as any)?.email?.toLowerCase().includes(lowerSearch),
    );
  }

  const totalCount = await REPORT.countDocuments(filters);
  const hasNext = pageNumber * pageSize < totalCount;

  const totalUsers = await USER.countDocuments({ documentStatus: true });
  const activeUsers = await USER.countDocuments({ isActive: true, documentStatus: true });
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newSignUps = await USER.countDocuments({ createdAt: { $gte: startOfMonth }, documentStatus: true });

  const stats = { totalUsers, activeUsers, newSignUps };

  return { reports, totalCount, hasNext, stats };
};

const resetUserWarnings = async (userId: string) => {
  return REPORT.updateMany({ reported: userId, documentStatus: true }, { $set: { warningLevel: 'low', attemptsLeft: 3, status: 'under_review' } });
};

const suspendUserReports = async (userId: string) => {
  return REPORT.updateMany(
    { reported: userId, documentStatus: true },
    {
      $set: {
        status: 'suspended',
        attemptsLeft: 0,
      },
    },
  );
};

const resetUserReports = async (userId: string) => {
  return REPORT.updateMany(
    { reported: userId, documentStatus: true },
    {
      $set: {
        documentStatus: false,
        warningLevel: 'low',
        attemptsLeft: 3,
      },
    },
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

export default {
  createReport,
  getAllReports,
  getReportedUserDetails,
  getAllReportsDownload,
  resetUserWarnings,
  suspendUserReports,
  resetUserReports,
  activateUserReports,
};
