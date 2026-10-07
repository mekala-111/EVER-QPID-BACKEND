import { Types } from 'mongoose';
import { paginate } from '../helper/paginationHelper';
import SUBSCRIPTION_PURCHASE_HISTORY from '../models/subscription-purchase-history/subscription-purchase-history';
import SubscriptionPurchaseHistoryEntity from '../entities/subscription-purchase-history-entity';
import { ISubscriptionPurchaseHistory, PlanType } from '../models/subscription-purchase-history/subscription-purchase-history-model';
import { PlanStatus, PurchaseStatus } from '../types/common';
import USER from '../models/user/user';
import { SubscribedPlanStatus } from '../models/user/user-model';
/**
 * Save a new purchase history record
 * @param {PurchaseHistoryEntity} subscriptionPurchaseHistoryData
 * @returns {Promise<ISubscriptionPurchaseHistory>}
 */
const saveOrderDetails = async (subscriptionPurchaseHistoryData: SubscriptionPurchaseHistoryEntity): Promise<ISubscriptionPurchaseHistory> => {
  const newPurchaseHistory: any = new SUBSCRIPTION_PURCHASE_HISTORY(subscriptionPurchaseHistoryData);
  return await newPurchaseHistory.save();
};

/**
 * Fetch purchase history by orderId
 * @param {string} orderId
 * @returns {Promise<IPurchaseHistory | null>}
 */
const getPurchaseHistoryByOrderId = async (orderId: string): Promise<ISubscriptionPurchaseHistory | null> => {
  const result = await SUBSCRIPTION_PURCHASE_HISTORY.findOne({ paymentOrderId: orderId }).lean();
  if (!result) {
    return null;
  }
  return result as ISubscriptionPurchaseHistory;
};

/**
 * Update purchase history by orderId
 * @param {string} orderId
 * @param {Partial<ICoinPurchaseHistory>} updateData
 * @returns {Promise<ICoinPurchaseHistory | null>}
 */
const updatePurchaseHistory = async (
  orderId: string,
  updateData: Partial<ISubscriptionPurchaseHistory>,
): Promise<ISubscriptionPurchaseHistory | null> => {
  const updatedPurchaseHistory = await SUBSCRIPTION_PURCHASE_HISTORY.findOneAndUpdate(
    { paymentOrderId: orderId },
    { $set: updateData },
    { new: true },
  ).lean();

  if (!updatedPurchaseHistory) {
    return null;
  }

  return updatedPurchaseHistory as ISubscriptionPurchaseHistory;
};

/**
 * Get all user order histories (user only)
 * @param {object} options
 * @param {string} userId
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} searchTag
 * @returns {Promise<{ orderHistory: ISubscriptionPurchaseHistory[], totalCount: number, hasNext: boolean }>}
 */
const getUserOrders = async ({
  userId,
  pageNumber,
  pageSize,
  searchTag,
}: {
  userId: string;
  pageNumber: number;
  pageSize: number;
  searchTag: string;
}): Promise<{ orderHistory: ISubscriptionPurchaseHistory[]; totalCount: number; hasNext: boolean }> => {
  const userObjectId = new Types.ObjectId(userId);

  const filters: Record<string, any> = { userId: userObjectId, purchaseStatus: PurchaseStatus.Completed };

  if (searchTag) {
    filters.$or = [{ paymentOrderId: { $regex: searchTag, $options: 'i' } }, { purchaseStatus: { $regex: searchTag, $options: 'i' } }];
  }

  const { data: orderHistory, totalCount, hasNext } = await paginate(SUBSCRIPTION_PURCHASE_HISTORY, { pageNumber, pageSize }, filters);
  return { orderHistory, totalCount, hasNext };
};

/**
 * Get all user order histories (admin only)
 * @param {object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @param {Date} [options.startDate]
 * @param {Date} [options.endDate]
 * @returns {Promise<{ orderHistory: any[], totalCount: number, hasNext: boolean }>}}
 */
const getAllOrdersAdmin = async ({
  pageNumber,
  pageSize,
  searchTag,
  startDate,
  endDate,
  userId,
}: {
  pageNumber: number;
  pageSize: number;
  searchTag?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}): Promise<{ orderHistory: any[]; totalCount: number; hasNext: boolean }> => {
  console.log(startDate, endDate);
  let filters = { documentStatus: true, purchaseStatus: PurchaseStatus.Completed };
  const aggregationPipeline: any[] = [
    {
      $match: filters,
    },
    {
      $lookup: {
        from: 'cln_users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    { $unwind: '$userDetails' },
  ];

  if (startDate && endDate) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    aggregationPipeline.push({
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    });
    filters = { ...filters, ...{ createdAt: { $gte: startDate, $lte: endDate } } };
  } else if (startDate) {
    startDate.setHours(0, 0, 0, 0);

    aggregationPipeline.push({
      $match: {
        createdAt: { $gte: startDate },
      },
    });
    filters = { ...filters, ...{ createdAt: { $gte: startDate } } };
  } else if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    aggregationPipeline.push({
      $match: {
        createdAt: { $lte: endDate },
      },
    });
    filters = { ...filters, ...{ createdAt: { $lte: endDate } } };
  }

  if (userId) {
    aggregationPipeline.push({
      $match: {
        userId: new Types.ObjectId(userId),
      },
    });
    filters = { ...filters, ...{ userId: new Types.ObjectId(userId) } };
  }

  if (searchTag) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { 'userDetails.userName': { $regex: searchTag, $options: 'i' } },
          { 'userDetails.name': { $regex: searchTag, $options: 'i' } },
          { paymentOrderId: { $regex: searchTag, $options: 'i' } },
          { receipt: { $regex: searchTag, $options: 'i' } },
        ],
      },
    });
  }

  const {
    data: orderHistory,
    totalCount,
    hasNext,
  } = await paginate(SUBSCRIPTION_PURCHASE_HISTORY, { pageNumber, pageSize }, filters, aggregationPipeline);

  return { orderHistory, totalCount, hasNext };
};

/**
 * Get total revenue
 * @param {Object} options - Optional date filters
 * @param {Date} [options.startDate] - Start date for filtering
 * @param {Date} [options.endDate] - End date for filtering
 * @returns {Promise<number>} - Total revenue
 */
const getTotalRevenue = async ({ startDate, endDate }: { startDate?: Date; endDate?: Date }): Promise<number> => {
  const filters: Record<string, any> = { documentStatus: true };

  if (startDate) filters.createdAt = { $gte: startDate };
  if (endDate) {
    filters.createdAt = {
      ...(filters.createdAt || {}),
      $lte: endDate,
    };
  }

  const totalRevenueData = await SUBSCRIPTION_PURCHASE_HISTORY.find(filters, 'sellingPrice'); // Only fetch `price` field for efficiency

  const totalRevenue = totalRevenueData.reduce((sum: number, data: { price: number }) => sum + data.price, 0);

  return totalRevenue;
};

const expireSubscriptionsAndUpdateUsers = async () => {
  const whereData = {
    documentStatus: true,
    planStatus: PlanStatus.Active,
    expiryDate: { $lte: new Date() },
    planType: PlanType.Subscription,
  };

  const expiredSubscriptions = await SUBSCRIPTION_PURCHASE_HISTORY.find(whereData).exec();

  const userIds = expiredSubscriptions.map((subscription) => subscription.userId);
  const subscribedPlanIds = expiredSubscriptions.map((subscription) => subscription._id);

  const uniqueSubscribedPlanIds = [...new Set(subscribedPlanIds)];
  await SUBSCRIPTION_PURCHASE_HISTORY.updateMany(whereData, { $set: { planStatus: PlanStatus.Expired } });

  const updateData: any = {
    subscribedPlanStatus: SubscribedPlanStatus.Expired,
  };

  if (userIds.length > 0 && updateData) {
    await USER.updateMany(
      {
        _id: { $in: userIds },
        subscribedPlanId: { $in: uniqueSubscribedPlanIds },
      },
      {
        $set: updateData,
      },
    );
  }

  return;
};

/**
 * Create purchase record
 */
export const createPurchaseRecord = async (purchaseData: Partial<ISubscriptionPurchaseHistory>) => {
  return await SUBSCRIPTION_PURCHASE_HISTORY.create(purchaseData);
};

/**
 * Update purchase status after verification
 */
export const updatePurchaseStatus = async (orderId: string, updateData: Partial<ISubscriptionPurchaseHistory>) => {
  return await SUBSCRIPTION_PURCHASE_HISTORY.findOneAndUpdate({ paymentOrderId: orderId }, updateData, { new: true });
};

/**
 * Increment user comment count
 */
export const incrementUserCommentCount = async (userId: string, count: number) => {
  return await USER.findByIdAndUpdate(userId, { $inc: { availableCommentsCount: count } }, { new: true });
};
/*----------------------------------------------------------------------------------*/
/**
 * Subscription  details of a user
 * @param {SubscriptionEntity} planEntity
 * @returns {Promise<ISubscription>}
 */
const getSubscriptionByUserId = async (userId: string): Promise<ISubscriptionPurchaseHistory | null> => {
  const searchConditions = {
    userId: new Types.ObjectId(userId),
    documentStatus: true,
    planStatus: PlanStatus.Active,
  };
  const subscriptionData = await SUBSCRIPTION_PURCHASE_HISTORY.findOne(searchConditions).select('-createdAt -createdUser -updatedUser -updatedAt');
  return subscriptionData;
};
const decrementLikeCount = async (subscriptionId: string) => {
  await SUBSCRIPTION_PURCHASE_HISTORY.updateOne({ _id: subscriptionId }, { $inc: { likeCount: -1 }, updatedAt: new Date() });
};

const findByUserId = async (userId: string): Promise<ISubscriptionPurchaseHistory[]> => {
  return SUBSCRIPTION_PURCHASE_HISTORY.find({
    userId: new Types.ObjectId(userId),
    documentStatus: true,
  })
    .select('paymentId paymentOrderId planName price createdAt purchaseStatus planType sellingPrice')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

export default {
  saveOrderDetails,
  getPurchaseHistoryByOrderId,
  updatePurchaseHistory,
  getUserOrders,
  getAllOrdersAdmin,
  getTotalRevenue,
  expireSubscriptionsAndUpdateUsers,
  createPurchaseRecord,
  updatePurchaseStatus,
  incrementUserCommentCount,
  getSubscriptionByUserId,
  decrementLikeCount,
  findByUserId,
};
