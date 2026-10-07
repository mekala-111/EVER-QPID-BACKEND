import { DurationUnit } from '../types/common';

export interface IFeatureWithSub {
  feature: string;
}

class SubscriptionEntity {
  planName: string;
  planTitle: string;
  price: number;
  sellingPrice: number; //
  imageUrl: string | null;
  features: IFeatureWithSub[];
  durationValue: number;
  durationUnit: DurationUnit;

  // Daily limits
  //likesPerDay: number | null; // null = unlimited
  messagesPerDay: number | null;
  superLikesPerDay: number | null;
  //commentsPerDay: number | null;

  // Toggle features
  unlimitedLikes: boolean;
  unlimitedMessages: boolean;
  unlimitedSuperLikes: boolean;
  isPlanActive: boolean;
  //unlimitedComments: boolean;
  // seeWhoLikesYou: boolean;
  // searchWithFilters: boolean;
  accessToClan: boolean;
  setPreferences: boolean;
  accessToRecentPasses: boolean;
  //accessGlobalProfiles: boolean;

  // Common
  createdUser: string;
  updatedUser: string;
  createdAt: Date;
  updatedAt: Date;
  documentStatus: boolean;
  constructor(
    planName: string,
    planTitle: string,
    price: number,
    sellingPrice: number,
    imageUrl: string | null,
    features: IFeatureWithSub[],
    durationValue: number,
    durationUnit: DurationUnit,
    //likesPerDay: number | null,
    messagesPerDay: number | null,
    superLikesPerDay: number | null,
    //commentsPerDay: number | null,
    unlimitedLikes: boolean,
    unlimitedMessages: boolean,
    unlimitedSuperLikes: boolean,
    isPlanActive: boolean,
    //unlimitedComments: boolean,
    // seeWhoLikesYou: boolean,
    // searchWithFilters: boolean,
    accessToClan: boolean,
    setPreferences: boolean,
    accessToRecentPasses: boolean,
    //accessGlobalProfiles: boolean,
    createdUser: string,
    updatedUser: string,
    createdAt: Date,
    updatedAt: Date,
    documentStatus: boolean,
  ) {
    this.planName = planName;
    this.planTitle = planTitle;
    this.price = price;
    this.sellingPrice = sellingPrice;
    this.imageUrl = imageUrl;
    this.features = features;
    this.durationValue = durationValue;
    this.durationUnit = durationUnit;

    //this.likesPerDay = likesPerDay;
    this.messagesPerDay = messagesPerDay;
    this.superLikesPerDay = superLikesPerDay;
    //this.commentsPerDay = commentsPerDay;

    this.unlimitedLikes = unlimitedLikes;
    this.unlimitedMessages = unlimitedMessages;
    this.unlimitedSuperLikes = unlimitedSuperLikes;
    this.isPlanActive = isPlanActive;
    //this.unlimitedComments = unlimitedComments;
    // this.seeWhoLikesYou = seeWhoLikesYou;
    // this.searchWithFilters = searchWithFilters;
    this.accessToClan = accessToClan;
    this.setPreferences = setPreferences;
    this.accessToRecentPasses = accessToRecentPasses;
    //this.accessGlobalProfiles = accessGlobalProfiles;

    this.createdUser = createdUser;
    this.updatedUser = updatedUser;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.documentStatus = documentStatus;
  }
}

export default SubscriptionEntity;
