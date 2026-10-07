import { Types } from 'mongoose';
import SubscriptionEntity from '../entities/subscription-entity';
import { paginate } from '../helper/paginationHelper';
import SUBSCRIPTIONPLAN from '../models/Subscription/Subscription';
import { ISubscriptionPlan } from '../models/Subscription/Subscription-model';

/**
 * Get subscription by ID
 * @param {string} id
 * @returns {Promise<ISubscriptionPlan | null>}
 */
const getById = async (id: string): Promise<ISubscriptionPlan | null> => {
  return await SUBSCRIPTIONPLAN.findById(id).lean();
};

/**
 * Create a new subscription plan
 * @param {SubscriptionEntity} subscriptionData
 * @returns {Promise<ISubscriptionPlan>}
 */
const create = async (subscriptionData: SubscriptionEntity): Promise<ISubscriptionPlan> => {
  const plainData = {
    ...subscriptionData,
    createdAt: subscriptionData.createdAt ?? new Date(),
    updatedAt: subscriptionData.updatedAt ?? new Date(),
  };

  const newSubscription = new SUBSCRIPTIONPLAN(plainData);
  return await newSubscription.save();
};

/**
 * Update a subscription plan by ID
 * @param {string} id
 * @param {Partial<ISubscriptionPlan>} updateData
 * @returns {Promise<ISubscriptionPlan | null>}
 */
const update = async (id: string, updateData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan | null> => {
  updateData.updatedAt = new Date();
  return await SUBSCRIPTIONPLAN.findByIdAndUpdate(id, updateData, { new: true }).exec();
};

/**
 * Delete a subscription plan by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteById = async (id: string): Promise<void> => {
  await SUBSCRIPTIONPLAN.findByIdAndDelete(id).exec();
};

/**
 * Get all subscription plans with pagination
 * @param {object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<{ subscriptions: ISubscriptionPlan[], totalCount: number, hasNext: boolean }>}
 */
const getAll = async ({
  pageNumber,
  pageSize,
}: {
  pageNumber: number;
  pageSize: number;
}): Promise<{ subscriptions: ISubscriptionPlan[]; totalCount: number; hasNext: boolean }> => {
  const { data: subscriptions, totalCount, hasNext } = await paginate(SUBSCRIPTIONPLAN, { pageNumber, pageSize }, { documentStatus: true });
  return { subscriptions, totalCount, hasNext };
};

/*----------------------------------------------------------------------------------*/
/**
 * Get all subscription plans count
 * @returns {Promise<number>}
 */
const getAllPlansCount = async (): Promise<number> => {
  const searchConditions: any = {
    documentStatus: true,
  };

  const totalCount = await SUBSCRIPTIONPLAN.countDocuments(searchConditions).exec();
  return totalCount;
};

const getAllPlansUser = async (userId: string, skip: number, limit: number): Promise<ISubscriptionPlan[]> => {
  const userObjectId = new Types.ObjectId(userId); // Convert userId to ObjectId
  console.log(userObjectId);

  const searchConditions = {
    documentStatus: true,
  };

  const subscriptions = await SUBSCRIPTIONPLAN.aggregate([
    {
      $match: searchConditions,
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'cln_subscription_purchase_history',
        let: { planId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$planId', '$$planId'] }, { $eq: ['$userId', userObjectId] }, { $eq: ['$subscriptionStatus', 'Active'] }],
              },
            },
          },
          {
            $addFields: {
              endDate: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$durationUnit', 'Minutes'] },
                      then: {
                        $dateAdd: {
                          startDate: '$purchasedDate',
                          unit: 'minute',
                          amount: '$durationValue',
                        },
                      },
                    },
                    {
                      case: { $eq: ['$durationUnit', 'Hours'] },
                      then: {
                        $dateAdd: {
                          startDate: '$purchasedDate',
                          unit: 'hour',
                          amount: '$durationValue',
                        },
                      },
                    },
                    {
                      case: { $eq: ['$durationUnit', 'Days'] },
                      then: {
                        $dateAdd: {
                          startDate: '$purchasedDate',
                          unit: 'day',
                          amount: '$durationValue',
                        },
                      },
                    },
                    {
                      case: { $eq: ['$durationUnit', 'Weeks'] },
                      then: {
                        $dateAdd: {
                          startDate: '$purchasedDate',
                          unit: 'week',
                          amount: '$durationValue',
                        },
                      },
                    },
                    {
                      case: { $eq: ['$durationUnit', 'Months'] },
                      then: {
                        $dateAdd: {
                          startDate: '$purchasedDate',
                          unit: 'month',
                          amount: '$durationValue',
                        },
                      },
                    },
                  ],
                  default: '$purchasedDate',
                },
              },
            },
          },
          {
            $project: {
              userId: 1,
              durationValue: 1,
              durationUnit: 1,
              planId: 1,
              planName: 1,
              purchasedDate: 1,
              endDate: 1,
              purchaseStatus: 1,
              planStatus: 1,
              planType: 1,
            },
          },
        ],
        as: 'subscriptionDetails',
      },
    },
    {
      $project: {
        planName: 1,
        planTitle: 1,
        features: 1,
        durationValue: 1,
        durationUnit: 1,
        price: 1,
        sellingPrice: 1,
        imageUrl: 1,
        sortNo: 1,
        likesPerDay: 1,
        superLikesPerDay: 1,
        messagePerDay: 1,
        unlimitedLikes: 1,
        unlimitedSuperLikes: 1,
        unlimitedMessages: 1,
        likeCount: 1,
        superLikes: 1,
        superLikeCount: 1,
        seeWhoLikesYou: 1,
        coinCount: 1,
        boostCount: 1,
        hideAds: 1,
        directMessageCount: 1,
        controlWhoSeeYou: 1,
        topPicks: 1,
        createdUser: 1,
        createdAt: 1,
        updatedUser: 1,
        updatedAt: 1,

        isSubscribed: {
          $gt: [{ $size: '$subscriptionDetails' }, 0], // Check if subscriptionDetails has elements
        },
        subscriptionDetails: 1,
      },
    },
  ]);
  console.log(subscriptions);

  return subscriptions as ISubscriptionPlan[];
};

const getActivePlansTotalAmount = async () => {
  const result = await SUBSCRIPTIONPLAN.aggregate([
    {
      $match: {
        isPlanActive: true,
        documentStatus: true,
      },
    },
    {
      $group: {
        _id: null,
        activePlansAmount: { $sum: '$sellingPrice' },
      },
    },
    { $project: { _id: 0, activePlansAmount: 1 } },
  ]);

  return result[0]?.activePlansAmount || 0;
};

const toggleStatus = async (subscriptionId: string): Promise<ISubscriptionPlan> => {
  const subscription = await SUBSCRIPTIONPLAN.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  subscription.isPlanActive = !subscription.isPlanActive;
  await subscription.save();
  return subscription;
};

export default {
  getById,
  create,
  update,
  deleteById,
  getAll,
  getAllPlansCount,
  getAllPlansUser,
  getActivePlansTotalAmount,
  toggleStatus,
};
