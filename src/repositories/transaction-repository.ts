import { ISubscriptionPurchaseHistory } from '../models/subscription-purchase-history/subscription-purchase-history-model';
import SUBSCRIPTIONPLAN from '../models/Subscription/Subscription';
import TRANSACTION from '../models/transaction/transaction';
import { ITransaction, TransactionStatus } from '../models/transaction/transaction-model';
import { IUser } from '../models/user/user-model';

const createTransaction = async (data: Partial<ITransaction>): Promise<ITransaction> => {
  const transaction = new TRANSACTION(data);
  return transaction.save();
};

const updateTransactionByOrderId = async (orderId: string, updateData: Partial<ITransaction>): Promise<ITransaction | null> => {
  return TRANSACTION.findOneAndUpdate({ orderId }, updateData, { new: true });
};

const getAllTransactions = async (skip: number, limit: number): Promise<{ transactions: ITransaction[]; totalCount: number }> => {
  const transactions = await TRANSACTION.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate<{ userId: IUser }>('userId', 'fullName email')
    .populate<{ referenceId: ISubscriptionPurchaseHistory }>('referenceId', 'planName');

  const totalCount = await TRANSACTION.countDocuments();

  return { transactions, totalCount };
};

const getTransactionByOrderId = async (orderId: string): Promise<ITransaction | null> => {
  return TRANSACTION.findOne({ orderId });
};

const getRevenueStats = async () => {
  const result = await TRANSACTION.aggregate([
    {
      $match: {
        status: TransactionStatus.Success,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalUsers: { $size: '$uniqueUsers' },
        averageRevenuePerUser: {
          $cond: [
            { $gt: [{ $size: '$uniqueUsers' }, 0] },
            {
              $divide: ['$totalRevenue', { $size: '$uniqueUsers' }],
            },
            0,
          ],
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalRevenue: 0,
      totalUsers: 0,
      averageRevenuePerUser: 0,
    }
  );
};

const getTransactionById = async (transactionId: string): Promise<ITransaction | null> => {
  return TRANSACTION.findById(transactionId).populate<{ userId: IUser }>('userId', 'fullName email').populate<{
    referenceId: ISubscriptionPurchaseHistory;
  }>('referenceId', 'planName price paymentOrderId paymentId receipt durationValue durationUnit');
};

const getTotalRevenue = async () => {
  const result = await TRANSACTION.aggregate([{ $match: { status: 'Success' } }, { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }]);
  return result[0]?.totalRevenue || 0;
};

const getUniqueUserCount = async () => {
  const result = await TRANSACTION.aggregate([{ $match: { status: 'Success' } }, { $group: { _id: '$userId' } }, { $count: 'uniqueUserCount' }]);
  return result[0]?.uniqueUserCount || 0;
};

const getActivePlansTotalAmount = async () => {
  const result = await SUBSCRIPTIONPLAN.aggregate([
    { $match: { isPlanActive: true } },
    {
      $group: {
        _id: null,
        activePlansTotalAmount: { $sum: '$price' },
      },
    },
  ]);

  return result[0]?.activePlansTotalAmount || 0;
};

interface ExportTransactionFilters {
  status?: string;
  fromDate?: Date | null;
  toDate?: Date | null;
}

const getTransactionsForExport = async (filters: ExportTransactionFilters) => {
  const { status, fromDate, toDate } = filters;

  const query: any = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = fromDate;
    if (toDate) query.createdAt.$lte = toDate;
  }

  const transactions = await TRANSACTION.find(query)
    .sort({ createdAt: -1 })
    .populate<{ userId: IUser }>('userId', 'fullName email')
    .populate<{ referenceId: ISubscriptionPurchaseHistory }>('referenceId', 'planName')
    .exec();

  return transactions.map((tx) => {
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
};

export default {
  createTransaction,
  updateTransactionByOrderId,
  getAllTransactions,
  getTransactionByOrderId,
  getRevenueStats,
  getTransactionById,
  getTotalRevenue,
  getUniqueUserCount,
  getActivePlansTotalAmount,
  getTransactionsForExport,
};
