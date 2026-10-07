import { ISubscriptionPurchaseHistory } from '../models/subscription-purchase-history/subscription-purchase-history-model';
import TRANSACTION from '../models/transaction/transaction';
import { IUser } from '../models/user/user-model';
import { subscriptionRepository } from '../repositories';
import transactionRepository from '../repositories/transaction-repository';

interface TransactionFilters {
  search?: string;
  status?: string;
  fromDate?: Date | null;
  toDate?: Date | null;
}

const getAllTransactions = async (page: number, limit: number, filters: TransactionFilters) => {
  const skip = (page - 1) * limit;
  const { search, status, fromDate, toDate } = filters;

  const query: any = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = fromDate;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  const transactionsQuery = TRANSACTION.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate<{ userId: IUser }>('userId', 'fullName email')
    .populate<{ referenceId: ISubscriptionPurchaseHistory }>('referenceId', 'planName');

  let transactions = await transactionsQuery.exec();

  if (search) {
    const lowerSearch = search.toLowerCase();
    transactions = transactions.filter(
      (tx) =>
        (tx.userId as IUser).fullName?.toLowerCase().includes(lowerSearch) ||
        (tx.referenceId as ISubscriptionPurchaseHistory).planName?.toLowerCase().includes(lowerSearch),
    );
  }

  const totalCount = await TRANSACTION.countDocuments(query);

  const formattedTransactions = transactions.map((tx) => {
    const user = tx.userId as IUser;
    const plan = tx.referenceId as ISubscriptionPurchaseHistory;

    return {
      transactionId: tx._id,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      createdAt: tx.createdAt,
      userName: user?.fullName ?? null,
      userEmail: user?.email ?? null,
      planName: plan?.planName ?? null,
    };
  });

  return {
    summary: {
      totalRevenue: await transactionRepository.getRevenueStats(),
      activePlansTotalAmount: await subscriptionRepository.getActivePlansTotalAmount(),
    },
    transactions: formattedTransactions,
    pagination: {
      page,
      limit,
      totalRecords: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

const getTransactionDetails = async (transactionId: string) => {
  const tx = await transactionRepository.getTransactionById(transactionId);

  if (!tx) {
    throw new Error('Transaction not found');
  }

  const user = tx.userId as IUser;
  const plan = tx.referenceId as ISubscriptionPurchaseHistory;

  return {
    transaction: {
      transactionId: tx._id,
      date: tx.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      time: tx.createdAt.toISOString().split('T')[1].split('.')[0], // HH:MM:SS
      userName: user?.fullName ?? null,
      planName: plan?.planName ?? null,
      status: tx.status,
    },
    paymentDetails: {
      paymentMethod: tx.paymentId ? 'Online' : 'Unknown', // or save method in transaction
      paymentReference: tx.paymentId || tx.orderId,
      planAmount: plan?.price ?? 0,
      totalAmount: tx.amount,
    },
  };
};

interface TransactionChartFilters {
  fromDate?: Date;
  toDate?: Date;
  gender?: string;
  location?: string;
  planName?: string;
}

const getTransactionStatusChart = async (filters: TransactionChartFilters) => {
  const { fromDate, toDate, gender, location, planName } = filters;

  const match: any = {};

  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = fromDate;
    if (toDate) match.createdAt.$lte = toDate;
  }

  const pipeline: any[] = [
    { $match: match },

    {
      $lookup: {
        from: 'cln_users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'cln_subscription_purchase_history',
        localField: 'referenceId',
        foreignField: '_id',
        as: 'plan',
      },
    },
    { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
  ];

  if (gender) {
    pipeline.push({ $match: { 'user.gender': gender } });
  }
  if (location) {
    pipeline.push({ $match: { 'user.locationString': { $regex: location, $options: 'i' } } });
  }
  if (planName) {
    pipeline.push({ $match: { 'plan.planName': { $regex: planName, $options: 'i' } } });
  }

  pipeline.push({
    $group: {
      _id: {
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, // e.g., 2025-12
        status: '$status',
      },
      totalAmount: { $sum: '$amount' },
    },
  });

  pipeline.push({ $sort: { '_id.month': 1 } });

  const results = await TRANSACTION.aggregate(pipeline);

  const chartData: Record<string, Record<string, number>> = {};

  results.forEach((r) => {
    const month = r._id.month;
    const status = r._id.status;
    if (!chartData[month]) chartData[month] = { Success: 0, Failed: 0, Pending: 0 };
    chartData[month][status] = r.totalAmount;
  });

  const formattedData = Object.entries(chartData).map(([month, amounts]) => ({
    month,
    ...amounts,
  }));

  return formattedData;
};

const getRevenueSummary = async () => {
  const totalRevenue = await transactionRepository.getTotalRevenue();
  const uniqueUserCount = await transactionRepository.getUniqueUserCount();
  const activePlansTotalAmount = await transactionRepository.getActivePlansTotalAmount();

  const averageRevenuePerUser = uniqueUserCount > 0 ? totalRevenue / uniqueUserCount : 0;

  return {
    totalRevenue,
    averageRevenuePerUser,
    activePlansTotalAmount,
  };
};

interface ExportTransactionFilters {
  status?: string;
  fromDate?: Date | null;
  toDate?: Date | null;
}

const getTransactionsForExport = async (filters: ExportTransactionFilters) => {
  return transactionRepository.getTransactionsForExport(filters);
};

export default { getAllTransactions, getTransactionDetails, getTransactionStatusChart, getRevenueSummary, getTransactionsForExport };
