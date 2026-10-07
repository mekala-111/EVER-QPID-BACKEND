import { Schema, model, Model } from 'mongoose';
import { ISubscriptionPlan } from './Subscription-model';

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    planName: { type: String, required: true, trim: true },
    planTitle: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    imageUrl: { type: String, trim: true, default: null },

    features: [
      {
        feature: { type: String, required: true, trim: true },
      },
    ],

    durationValue: { type: Number, required: true },
    durationUnit: {
      type: String,
      enum: ['Minutes', 'Hours', 'Days', 'Weeks', 'Months'],
      required: true,
    },

    //likesPerDay: { type: Number, default: null },
    messagesPerDay: { type: Number, default: null },
    superLikesPerDay: { type: Number, default: null },
    //commentsPerDay: { type: Number, default: null },

    unlimitedLikes: { type: Boolean, default: false },
    unlimitedMessages: { type: Boolean, default: false },
    unlimitedSuperLikes: { type: Boolean, default: false },
    isPlanActive: { type: Boolean, default: false },
    //unlimitedComments: { type: Boolean, default: false },

    // seeWhoLikesYou: { type: Boolean, default: false },
    // searchWithFilters: { type: Boolean, default: false },
    accessToClan: { type: Boolean, default: false },
    setPreferences: { type: Boolean, default: false },
    accessToRecentPasses: { type: Boolean, default: false },
    //accessGlobalProfiles: { type: Boolean, default: false },

    //commentPlans: [{ type: Schema.Types.ObjectId, ref: 'cln_comment_plans' }],

    createdUser: { type: Schema.Types.ObjectId, ref: 'cln_users' },
    updatedUser: { type: Schema.Types.ObjectId, ref: 'cln_users' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    documentStatus: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

subscriptionPlanSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const SUBSCRIPTIONPLAN: Model<ISubscriptionPlan> = model<ISubscriptionPlan>('cln_subscription_plans', subscriptionPlanSchema);

export default SUBSCRIPTIONPLAN;
