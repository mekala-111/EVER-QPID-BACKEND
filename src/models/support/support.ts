import { Schema, model, Model } from 'mongoose';
import { ISupport } from './support-model';

const supportSchema = new Schema<ISupport>({
  documentStatus: { type: Boolean, required: true, default: true },
  userId: { type: Schema.Types.ObjectId, ref: 'cln_user', required: false },
  email: { type: String, required: true },
  firstName: { type: String, required: false },
  //phoneNumber: { type: String, required: true },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  //category: { type: Schema.Types.ObjectId, ref: 'cln_ticket_categories', required: true },
  //type: { type: String },
  description: { type: String, required: true },
  attachments: [{ type: String }],
  status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'cln_employee', default: null },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

supportSchema.pre<ISupport>('save', function (next) {
  const priorityMapping: Record<string, string> = {
    'Report Abuse': 'high',
    Safety: 'high',
    'Profile Verification': 'high',
    Payment: 'high',
    Subscription: 'high',
    'Chat Issue': 'low',
    'Match Issue': 'medium',
    Account: 'medium',
    General: 'low',
  };

  if (this.category && priorityMapping[this.category]) {
    this.priority = priorityMapping[this.category] as any;
  } else {
    this.priority = 'medium'; // default fallback
  }

  this.updatedAt = new Date();
  next();
});

const SUPPORT: Model<ISupport> = model<ISupport>('cln_support', supportSchema);
export default SUPPORT;
