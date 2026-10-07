import { Model, Schema, model } from 'mongoose';
import { IFavourite } from './favourite-model';

const favoriteSchema: Schema<IFavourite> = new Schema<IFavourite>(
  {
    documentStatus: { type: Boolean, required: true, default: true },
    userId: { type: Schema.Types.ObjectId, ref: 'cln_users', required: true },
    favProfileId: { type: Schema.Types.ObjectId, ref: 'cln_users', required: true },
    createdUser: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    createdAt: { type: Date, default: null },
    updatedUser: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    updatedAt: { type: Date, default: null },
    isPined: { type: Boolean, required: true, default: false },
    pinedOn: { type: Date, default: null },
  },
  { timestamps: true },
);

// Update the `updatedAt` field before saving the document
favoriteSchema.pre<IFavourite>('save', function (next) {
  this.createdAt = new Date();
  next();
});

// Define the model for the schema
const FAVORITES: Model<IFavourite> = model<IFavourite>('cln_Favorite', favoriteSchema);

export default FAVORITES;
