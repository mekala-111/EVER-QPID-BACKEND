import { Document, Types } from 'mongoose';
import { DurationUnit, PurchaseStatus } from '../../types/common';

export enum PlanType {
  Subscription = 'Subscription',
  Comment = 'Comment',
}

export interface ISubscriptionPurchaseHistory extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  userId: Types.ObjectId;
  price: number;
  sellingPrice: number;
  durationValue: number;
  durationUnit: DurationUnit;
  planId: Types.ObjectId;
  planName: string;
  purchasedDate: Date | null;
  purchaseStatus: PurchaseStatus;
  paymentOrderId: string;
  paymentId: string;
  receipt: string;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
  planStatus: string;
  planType: PlanType;
  isUnLimitedLikes: boolean;
  likeCount: number;
}
