import SubscriptionEntity from '../entities/subscription-entity';
import { ISubscriptionPlan } from '../models/Subscription/Subscription-model';
import subscriptionRepository from '../repositories/subscription-repository';
import { validateNotFound, validateRequiredField, validateUserAuthorization } from '../utils/validators';

/**
 * Get all subscriptions (for users or admin)
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<ISubscriptionPlan[]>}
 */
const getAllSubscriptions = async ({
  pageNumber,
  pageSize,
}: {
  pageNumber: number;
  pageSize: number;
}): Promise<{ subscriptions: ISubscriptionPlan[]; totalCount: number; hasNext: boolean }> => {
  const { subscriptions, totalCount, hasNext } = await subscriptionRepository.getAll({
    pageNumber,
    pageSize,
  });
  return { subscriptions, totalCount, hasNext };
};

/**
 * Create a new subscription (Admin only)
 * @param {Partial<ISubscriptionPlan>} subscriptionData
 * @returns {Promise<ISubscriptionPlan>}
 */
const createSubscription = async (adminId: string, subscriptionData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan> => {
  validateUserAuthorization(adminId);

  validateRequiredField(subscriptionData.planName, 'planName');
  validateRequiredField(subscriptionData.price, 'price');
  validateRequiredField(subscriptionData.sellingPrice, 'sellingPrice');
  validateRequiredField(subscriptionData.durationValue, 'durationValue');
  validateRequiredField(subscriptionData.durationUnit, 'durationUnit');

  const subscriptionEntity = new SubscriptionEntity(
    subscriptionData.planName!,
    subscriptionData.planTitle!,
    subscriptionData.price!,
    subscriptionData.sellingPrice!,
    subscriptionData.imageUrl ?? null,
    subscriptionData.features ?? [],
    subscriptionData.durationValue!,
    subscriptionData.durationUnit!,
    subscriptionData.messagesPerDay ?? null,
    subscriptionData.superLikesPerDay ?? null,
    subscriptionData.unlimitedLikes ?? false,
    subscriptionData.unlimitedMessages ?? false,
    subscriptionData.unlimitedSuperLikes ?? false,
    subscriptionData.isPlanActive ?? false,
    subscriptionData.accessToClan ?? false,
    subscriptionData.setPreferences ?? false,
    subscriptionData.accessToRecentPasses ?? false,
    adminId,
    adminId,
    new Date(),
    new Date(),
    true,
  );

  const newSubscription = await subscriptionRepository.create({ ...subscriptionEntity });
  return newSubscription;
};

/**
 * Update an existing subscription (Admin only)
 * @param {string} id
 * @param {Partial<ISubscriptionPlan>} updateData
 * @returns {Promise<ISubscriptionPlan | null>}
 */
const updateSubscription = async (id: string, adminId: string, updateData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan | null> => {
  validateUserAuthorization(adminId);

  validateRequiredField(updateData.planName, 'planName');
  validateRequiredField(updateData.durationValue, 'durationValue');
  validateRequiredField(updateData.durationUnit, 'durationUnit');
  validateRequiredField(updateData.price, 'price');
  validateRequiredField(updateData.sellingPrice, 'sellingPrice');
  const existingSubscription = await subscriptionRepository.getById(id);
  validateNotFound(existingSubscription, 'existingSubscription');

  updateData.updatedUser = adminId;
  updateData.updatedAt = new Date();

  const updatedSubscription = await subscriptionRepository.update(id, updateData);
  validateNotFound(updatedSubscription, 'updatedSubscription');

  return updatedSubscription;
};

/**
 * Delete a subscription (Admin only)
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteSubscription = async (id: string): Promise<void> => {
  const existingSubscription = await subscriptionRepository.getById(id);
  validateNotFound(existingSubscription, 'existingSubscription');

  await subscriptionRepository.update(id, { documentStatus: false });
};

/**
 * Get subscription details by ID (Admin only)
 * @param {string} id
 * @returns {Promise<ISubscriptionPlan>}
 */
const getSubscriptionDetails = async (id: string): Promise<ISubscriptionPlan> => {
  const subscription = await subscriptionRepository.getById(id);
  validateNotFound(subscription, 'subscription');
  return subscription as ISubscriptionPlan;
};
/*----------------------------------------------------------------------------------*/
/**
 * Get all subscription plans
 * @returns {Promise<{ subscriptions: ISubscriptionPlan[], totalCount: number }>}
 */
const getAllSubscriptionPlansUser = async (
  userId: string,
  pageNumber: number,
  pageSize: number,
): Promise<{ subscriptions: ISubscriptionPlan[]; totalCount: number; hasNext: boolean }> => {
  const skip = (pageNumber - 1) * pageSize;
  let hasNext = false;
  const [subscriptions, totalCount] = await Promise.all([
    subscriptionRepository.getAllPlansUser(userId, skip, pageSize),
    subscriptionRepository.getAllPlansCount(),
  ]);
  if (totalCount > skip + pageSize) hasNext = true;
  return { subscriptions, totalCount, hasNext };
};

const toggleSubscriptionStatus = async (subscriptionId: string): Promise<ISubscriptionPlan> => {
  return await subscriptionRepository.toggleStatus(subscriptionId);
};

export default {
  getAllSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionDetails,
  getAllSubscriptionPlansUser,
  toggleSubscriptionStatus,
};
