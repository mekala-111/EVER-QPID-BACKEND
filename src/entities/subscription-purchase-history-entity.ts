import { Types } from 'mongoose';
import { DurationUnit, PurchaseStatus } from '../types/common';

class SubscriptionPurchaseHistoryEntity {
  documentStatus: boolean;
  userId: Types.ObjectId;
  price: number;
  sellingPrice: number;
  durationValue: number;
  durationUnit: DurationUnit;
  planId: Types.ObjectId;
  planName: string;
  purchaseStatus: PurchaseStatus;
  paymentOrderId: string | null;
  paymentId: string | null;
  receipt: string;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
  planStatus: string;
  planType: string;
  isUnLimitedLikes: boolean;
  //likeCount: number;
  constructor(
    documentStatus: boolean,
    userId: Types.ObjectId,
    price: number,
    sellingPrice: number,
    durationValue: number,
    durationUnit: DurationUnit,
    planId: Types.ObjectId,
    planName: string,
    purchaseStatus: PurchaseStatus,
    paymentOrderId: string | null,
    paymentId: string | null,
    receipt: string,
    createdUser: Types.ObjectId | null,
    createdAt: Date | null,
    updatedUser: Types.ObjectId | null,
    updatedAt: Date | null,
    planStatus: string,
    planType: string,
    isUnLimitedLikes: boolean,
    //likeCount: number,
  ) {
    this.documentStatus = documentStatus;
    this.userId = userId;
    this.price = price;
    this.sellingPrice = sellingPrice;
    this.durationValue = durationValue;
    this.durationUnit = durationUnit;
    this.planId = planId;
    this.planName = planName;
    this.purchaseStatus = purchaseStatus;
    this.paymentOrderId = paymentOrderId;
    this.paymentId = paymentId;
    this.receipt = receipt;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
    this.planStatus = planStatus;
    this.planType = planType;
    this.isUnLimitedLikes = isUnLimitedLikes;
    //this.likeCount = likeCount;
  }
}

export default SubscriptionPurchaseHistoryEntity;
