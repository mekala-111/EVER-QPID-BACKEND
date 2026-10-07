import { Document, Types } from 'mongoose';
import { DurationUnit } from '../../types/common';

export interface IFeatureWithSub {
  feature: string;
}

export interface ISubscriptionPlan extends Document {
  planName: string;
  planTitle: string;
  price: number;
  sellingPrice: number;
  imageUrl?: string | null;
  features: IFeatureWithSub[];
  durationValue: number;
  durationUnit: DurationUnit;

  //likesPerDay: number | null;
  messagesPerDay: number | null;
  superLikesPerDay: number | null;
  //commentsPerDay: number | null;

  unlimitedLikes: boolean;
  unlimitedMessages: boolean;
  unlimitedSuperLikes: boolean;
  isPlanActive: boolean;
  //unlimitedComments: boolean;

  //seeWhoLikesYou: boolean;
  //searchWithFilters: boolean;
  accessToClan: boolean;
  setPreferences: boolean;
  accessToRecentPasses: boolean;
  //accessGlobalProfiles: boolean;
  //commentPlans?: Types.ObjectId[] | string[];

  createdUser: Types.ObjectId | string;
  updatedUser: Types.ObjectId | string;

  createdAt: Date;
  updatedAt: Date;
  documentStatus: boolean;
}
