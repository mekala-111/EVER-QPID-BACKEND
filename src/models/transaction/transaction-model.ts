import { Document, Types } from 'mongoose';
import { ISubscriptionPurchaseHistory } from '../subscription-purchase-history/subscription-purchase-history-model';
import { IUser } from '../user/user-model';

export enum TransactionStatus {
  Pending = 'Pending',
  Success = 'Success',
  Failed = 'Failed',
}

export enum TransactionType {
  Subscription = 'Subscription',
  Comment = 'Comment',
}

export interface ITransaction extends Document {
  userId: Types.ObjectId | IUser;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  transactionType: TransactionType;
  referenceId: Types.ObjectId | ISubscriptionPurchaseHistory;
  createdAt: Date;
  updatedAt: Date;
}
