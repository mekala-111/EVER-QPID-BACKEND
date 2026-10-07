import { Schema, model, Model } from 'mongoose';
import { IReport } from './report-model';

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    reported: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    reason: { type: String, required: true },
    warningLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },

    attemptsLeft: {
      type: Number,
      default: 3,
    },

    status: {
      type: String,
      enum: ['under_review', 'active', 'final_warning', 'suspended'],
      default: 'under_review',
    },
    //details: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    documentStatus: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

reportSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const REPORT: Model<IReport> = model<IReport>('cln_report', reportSchema);

export default REPORT;
