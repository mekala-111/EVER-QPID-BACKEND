import { Schema, model, models, Model } from 'mongoose';
import { ITransaction, TransactionStatus, TransactionType } from './transaction-model';

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    orderId: { type: String, required: true },
    paymentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
    },
    transactionType: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      ref: 'cln_subscription_purchase_history',
      required: true,
    },
  },
  { timestamps: true },
);

const TRANSACTION: Model<ITransaction> = models.cln_transactions || model<ITransaction>('cln_transactions', transactionSchema);

export default TRANSACTION;
