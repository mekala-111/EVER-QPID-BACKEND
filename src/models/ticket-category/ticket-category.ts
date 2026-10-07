import { Schema, model, Model } from 'mongoose';
import { ITicketCategory } from './ticket-category-model';

const ticketCategorySchema = new Schema<ITicketCategory>({
  categoryName: { type: String, required: true },
  documentStatus: { type: Boolean, required: true, default: true },
  createdUser: { type: Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Schema.Types.ObjectId, default: null },
  updatedAt: { type: Date, default: Date.now },
});

// Update the `updatedAt` field before saving the document
ticketCategorySchema.pre<ITicketCategory>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const TICKET_CATEGORY: Model<ITicketCategory> = model<ITicketCategory>('cln_ticket_categories', ticketCategorySchema);

export default TICKET_CATEGORY;
