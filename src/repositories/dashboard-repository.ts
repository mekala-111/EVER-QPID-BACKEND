import TRANSACTION from '../models/transaction/transaction';
import USER from '../models/user/user';
import { MonthlyGenderAgg } from '../types/monthlyGender';

const getMonthlyGenderStats = async (year: number): Promise<MonthlyGenderAgg[]> => {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const data = await USER.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        documentStatus: true,
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          gender: '$gender',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  return data as MonthlyGenderAgg[];
};

export type MostActiveClanAgg = {
  _id: string;
  count: number;
};

const getMostActiveClans = async (): Promise<MostActiveClanAgg[]> => {
  return USER.aggregate([
    {
      $match: {
        documentStatus: true,
        isActive: true,
      },
    },

    {
      $project: {
        cities: {
          $filter: {
            input: ['$homeLocation.city', '$workLocation.city', '$studyLocation.city'],
            as: 'city',
            cond: { $ne: ['$$city', ''] },
          },
        },
      },
    },

    { $unwind: '$cities' },

    {
      $group: {
        _id: '$cities',
        count: { $sum: 1 },
      },
    },

    { $sort: { count: -1 } },

    { $limit: 10 },
  ]);
};

interface MonthlyAgg {
  _id: {
    month: number;
    year: number;
  };
  totalUsers?: number;
  menUsers?: number;
  womenUsers?: number;
  revenue?: number;
}

const getMonthlyDashboardSummary = async (year: number): Promise<MonthlyAgg[]> => {
  const userAgg = await USER.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        totalUsers: { $sum: 1 },
        menUsers: { $sum: { $cond: [{ $eq: ['$gender', 'Man'] }, 1, 0] } },
        womenUsers: { $sum: { $cond: [{ $eq: ['$gender', 'Women'] }, 1, 0] } },
      },
    },
  ]);

  const revenueAgg = await TRANSACTION.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        revenue: { $sum: '$amount' },
      },
    },
  ]);

  const merged: MonthlyAgg[] = userAgg.map((u) => {
    const r = revenueAgg.find((rev) => rev._id.month === u._id.month && rev._id.year === u._id.year);
    return { ...u, revenue: r?.revenue || 0 };
  });

  return merged;
};

interface OverallDashboardAgg {
  totalUsers: number;
  menUsers: number;
  womenUsers: number;
  revenue: number;
}

const getOverallDashboardSummary = async (year: number): Promise<OverallDashboardAgg> => {
  const userAgg = await USER.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        menUsers: {
          $sum: { $cond: [{ $eq: ['$gender', 'Man'] }, 1, 0] },
        },
        womenUsers: {
          $sum: { $cond: [{ $eq: ['$gender', 'Women'] }, 1, 0] },
        },
      },
    },
  ]);

  const revenueAgg = await TRANSACTION.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$amount' },
      },
    },
  ]);

  const users = userAgg[0] || {};
  const revenue = revenueAgg[0] || {};

  return {
    totalUsers: users.totalUsers || 0,
    menUsers: users.menUsers || 0,
    womenUsers: users.womenUsers || 0,
    revenue: revenue.revenue || 0,
  };
};

export default { getMonthlyGenderStats, getMostActiveClans, getMonthlyDashboardSummary, getOverallDashboardSummary };
