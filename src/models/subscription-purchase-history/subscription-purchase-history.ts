import { Model, Schema, model, models } from 'mongoose';
import { ISubscriptionPurchaseHistory, PlanType } from './subscription-purchase-history-model';
import { PlanStatus, PurchaseStatus } from '../../types/common';

const subscriptionPurchaseHistorySchema: Schema = new Schema<ISubscriptionPurchaseHistory>({
  documentStatus: { type: Boolean, required: true, default: true },
  userId: { type: Schema.Types.ObjectId, ref: 'cln_users', required: true },
  price: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  durationValue: { type: Number, required: true },
  durationUnit: {
    type: String,
    enum: ['Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Unlimited'],
    required: true,
  },
  planId: { type: Schema.Types.ObjectId, ref: 'cln_subscription_plans', required: true },
  planName: { type: String, required: true },

  purchaseStatus: {
    type: String,
    enum: Object.values(PurchaseStatus),
    required: true,
  },
  paymentOrderId: { type: String, required: false, default: null },
  paymentId: { type: String, default: null },
  receipt: { type: String, required: true },
  createdUser: { type: Schema.Types.ObjectId, ref: 'cln_users', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Schema.Types.ObjectId, ref: 'cln_users', default: null },
  updatedAt: { type: Date, default: Date.now },
  planStatus: {
    type: String,
    enum: Object.values(PlanStatus),
    required: true,
  },
  planType: {
    type: String,
    enum: PlanType,
    required: true,
  },
  isUnLimitedLikes: { type: Boolean, required: true, default: false },
  likeCount: { type: Number, required: true, default: 0 },
});

// Update the `updatedAt` field before saving the document
subscriptionPurchaseHistorySchema.pre<ISubscriptionPurchaseHistory>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Create the model
const SUBSCRIPTION_PURCHASE_HISTORY: Model<ISubscriptionPurchaseHistory> =
  models.cln_subscription_purchase_history ||
  model<ISubscriptionPurchaseHistory>('cln_subscription_purchase_history', subscriptionPurchaseHistorySchema);

export default SUBSCRIPTION_PURCHASE_HISTORY;
