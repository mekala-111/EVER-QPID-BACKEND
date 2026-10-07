import { Types } from 'mongoose';

export enum TransactionStatus {
  Pending = 'Pending',
  Success = 'Success',
  Failed = 'Failed',
}

export enum TransactionType {
  Subscription = 'Subscription',
}

class TransactionEntity {
  userId: Types.ObjectId;
  orderId: string;
  paymentId: string | null;
  amount: number;
  currency: string;
  status: TransactionStatus;
  transactionType: TransactionType;
  referenceId: Types.ObjectId;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(
    userId: Types.ObjectId,
    orderId: string,
    paymentId: string | null,
    amount: number,
    currency: string,
    status: TransactionStatus,
    transactionType: TransactionType,
    referenceId: Types.ObjectId,
    createdAt: Date | null,
    updatedAt: Date | null,
  ) {
    this.userId = userId;
    this.orderId = orderId;
    this.paymentId = paymentId;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.transactionType = transactionType;
    this.referenceId = referenceId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default TransactionEntity;
