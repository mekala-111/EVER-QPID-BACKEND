import { subscriptionPurchaseRepository, userRepository, subscriptionRepository } from '../repositories';
import { validateNotFound, validateUserAuthorization } from '../utils/validators';
import { validateRequiredField } from '../utils/validators';
import { Types } from 'mongoose';
import { generateOrderNumber } from '../helper/receipt';
import config from '../config/config';
import Razorpay from '../utils/razorpay-service';
import { IUser } from '../models/user/user-model';
import SubscriptionPurchaseHistoryEntity from '../entities/subscription-purchase-history-entity';
import { ISubscriptionPurchaseHistory, PlanType } from '../models/subscription-purchase-history/subscription-purchase-history-model';
import { ISubscriptionPlan } from '../models/Subscription/Subscription-model';
import { PlanStatus, PurchaseStatus } from '../types/common';
import ERROR from '../middlewares/web_server/http-error';
import calculateEndDate from '../utils/calculateEndDate';
import transactionRepository from '../repositories/transaction-repository';
import TransactionEntity, { TransactionStatus, TransactionType } from '../entities/transaction-entiry';
/**
 * Create a new subscription order
 * @param {string} userId
 * @param {string} subscriptionId
 * @returns {Promise<any>}
 */
const createPayment = async (userId: string, subscriptionId: string): Promise<any> => {
  validateUserAuthorization(userId);
  validateRequiredField(subscriptionId, 'subscriptionId');

  const subscriptionPackage = await subscriptionRepository.getById(subscriptionId);
  if (!subscriptionPackage || !subscriptionPackage._id) {
    throw new ERROR.NotFoundError('Subscription package not found!');
  }

  const userDetails = await userRepository.findUserById(new Types.ObjectId(userId));
  validateNotFound(userDetails, 'userDetails');
  const activeSubscription: ISubscriptionPurchaseHistory | null = await subscriptionPurchaseRepository.getSubscriptionByUserId(userId);
  if (activeSubscription && activeSubscription._id) {
    throw new ERROR.DocumentExistsError('You already have a active subscription plan!');
  }

  const validUserDetails = userDetails as IUser;
  const validSubscriptionPackage = subscriptionPackage as ISubscriptionPlan;

  const amount = validSubscriptionPackage.sellingPrice;

  const notes = {
    userId,
    name: validUserDetails.fullName,
    phone: `+${validUserDetails.countryCode}${validUserDetails.mobileNumber}`,
    email: validUserDetails.email,
  };

  const receipt = await generateOrderNumber();

  const razorpayService = new Razorpay();
  const order: any = await razorpayService.createOrder(amount, config.currency, receipt, notes);

  const now = new Date();
  calculateEndDate(validSubscriptionPackage.durationValue, validSubscriptionPackage.durationUnit);
  const subscriptionPurchaseHistoryData = new SubscriptionPurchaseHistoryEntity(
    true,
    new Types.ObjectId(userId),
    validSubscriptionPackage.price,
    validSubscriptionPackage.sellingPrice,
    validSubscriptionPackage.durationValue,
    validSubscriptionPackage.durationUnit,
    new Types.ObjectId(subscriptionId),
    validSubscriptionPackage.planName,
    PurchaseStatus.Pending,
    order.id,
    null,
    receipt,
    new Types.ObjectId(userId),
    now,
    null,
    null,
    PlanStatus.Payment_Pending,
    PlanType.Subscription,
    subscriptionPackage.unlimitedLikes ?? false,
  );

  const savedOrder = await subscriptionPurchaseRepository.saveOrderDetails(subscriptionPurchaseHistoryData);
  const transactionEntity = new TransactionEntity(
    new Types.ObjectId(userId),
    order.id,
    null,
    amount,
    config.currency,
    TransactionStatus.Pending,
    TransactionType.Subscription,
    savedOrder._id,
    now,
    null,
  );

  await transactionRepository.createTransaction({
    userId: transactionEntity.userId,
    orderId: transactionEntity.orderId,
    paymentId: transactionEntity.paymentId ?? undefined, // key fix
    amount: transactionEntity.amount,
    currency: transactionEntity.currency,
    status: transactionEntity.status,
    transactionType: transactionEntity.transactionType,
    referenceId: transactionEntity.referenceId,
  });

  console.log(savedOrder);
  return order;
};

/**
 * Verify the payment
 * @param {string} userId
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {Promise<ISubscriptionPurchaseHistory | null>}
 */
const verifyPayment = async (userId: string, orderId: string, paymentId: string, signature: string): Promise<ISubscriptionPurchaseHistory | null> => {
  validateUserAuthorization(userId);
  validateRequiredField(paymentId, 'paymentId');
  validateRequiredField(orderId, 'orderId');
  validateRequiredField(signature, 'signature');

  const purchaseHistory: ISubscriptionPurchaseHistory | null = await subscriptionPurchaseRepository.getPurchaseHistoryByOrderId(orderId);
  validateNotFound(purchaseHistory, 'purchaseHistory');

  const subscriptionData = await subscriptionRepository.getById(purchaseHistory?.planId?.toString() || '');

  const validPurchaseHistory = purchaseHistory as ISubscriptionPurchaseHistory;
  const amount = validPurchaseHistory.sellingPrice;
  const currency = config.currency;

  const razorpayService = new Razorpay();
  const isVerified: boolean = await razorpayService.verifyAndCapturePayment(orderId, paymentId, amount, currency, signature);

  if (isVerified) {
    let expiryDate: Date | null = null;

    if (subscriptionData) {
      expiryDate = calculateEndDate(subscriptionData.durationValue, subscriptionData.durationUnit);
    }

    const updateData: Partial<ISubscriptionPurchaseHistory> = {
      paymentId,
      purchaseStatus: PurchaseStatus.Completed,
      updatedAt: new Date(),
      purchasedDate: new Date(),
      planStatus: PlanStatus.Active,
      ...(expiryDate ? { expiryDate } : {}),
    };
    const updatedPurchaseHistory = await subscriptionPurchaseRepository.updatePurchaseHistory(orderId, updateData);
    await userRepository.updateSubscription(userId, purchaseHistory?.planId?.toString() || '');

    await transactionRepository.updateTransactionByOrderId(orderId, {
      paymentId,
      status: TransactionStatus.Success,
      updatedAt: new Date(),
    });

    return updatedPurchaseHistory;
  } else {
    await transactionRepository.updateTransactionByOrderId(orderId, {
      status: TransactionStatus.Failed,
      updatedAt: new Date(),
    });
    console.log('Payment verification failed. No changes saved!');
    return null;
  }
};

/**
 * Get all user order histories (user only)
 * @param {string} userId
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<{ orderHistory: ISubscriptionPurchaseHistory[], hasNext: boolean, totalCount: number }>}
 */
const getUserOrders = async (
  userId: string,
  { pageNumber, pageSize, searchTag }: { pageNumber: number; pageSize: number; searchTag: string },
): Promise<{ orderHistory: ISubscriptionPurchaseHistory[]; hasNext: boolean; totalCount: number }> => {
  validateUserAuthorization(userId);

  const { orderHistory, totalCount, hasNext } = await subscriptionPurchaseRepository.getUserOrders({
    userId,
    pageNumber,
    pageSize,
    searchTag,
  });

  return { orderHistory, hasNext, totalCount };
};

/**
 * Get all orders for admin with optional filters and pagination
 * @param {string} adminId - Admin ID
 * @param {Object} options - Pagination and filters
 * @param {number} options.pageNumber - Page number
 * @param {number} options.pageSize - Page size
 * @param {string} options.searchTag - Search keyword
 * @param {Date} options.startDate - Start date for filtering
 * @param {Date} options.endDate - End date for filtering
 * @returns {Promise<{ orderHistory: ISubscriptionPurchaseHistory[], hasNext: boolean, totalCount: number }>}
 */
const getAllOrdersAdmin = async ({
  adminId,
  pageNumber,
  pageSize,
  searchTag,
  startDate,
  endDate,
  userId,
}: {
  adminId: string;
  pageNumber: number;
  pageSize: number;
  searchTag: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}): Promise<{ orderHistory: ISubscriptionPurchaseHistory[]; hasNext: boolean; totalCount: number }> => {
  validateUserAuthorization(adminId);
  const { orderHistory, totalCount, hasNext } = await subscriptionPurchaseRepository.getAllOrdersAdmin({
    pageNumber,
    pageSize,
    searchTag,
    startDate,
    endDate,
    userId,
  });

  return { orderHistory, hasNext, totalCount };
};

/**
 * Calculate total revenue
 * @param {Object} options - Optional date filters
 * @param {string} [options.startDate] - Start date for filtering
 * @param {string} [options.endDate] - End date for filtering
 * @returns {Promise<number>} - Total revenue
 */
const calculateTotalRevenue = async ({ startDate, endDate }: { startDate?: string; endDate?: string }): Promise<number> => {
  const parsedStartDate = startDate ? new Date(startDate) : undefined;
  const parsedEndDate = endDate ? new Date(endDate) : undefined;

  return await subscriptionPurchaseRepository.getTotalRevenue({ startDate: parsedStartDate, endDate: parsedEndDate });
};

/**
 * Expire all date passed subscriptions
 * To be called every midnight with the help of a schedular functions
 */
const expireSubscriptionsAndUpdateUsers = async () => {
  try {
    await subscriptionPurchaseRepository.expireSubscriptionsAndUpdateUsers();
  } catch (e) {
    console.log(e);
  }
};

const getUserTransactions = async (userId: string) => {
  const transactions = await subscriptionPurchaseRepository.findByUserId(userId);

  return transactions.map((tx) => ({
    transactionId: tx._id,
    date: tx.createdAt,
    plan: tx.planName,
    amount: tx.sellingPrice,
    status: tx.purchaseStatus,
    planType: tx.planType,
  }));
};

export default {
  createPayment,
  verifyPayment,
  getUserOrders,
  getAllOrdersAdmin,
  calculateTotalRevenue,
  expireSubscriptionsAndUpdateUsers,
  getUserTransactions,
};
