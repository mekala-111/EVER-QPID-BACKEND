import { Schema, model, Model } from 'mongoose';
import { IUserSearchFilter } from './user-search-filter-model';

const userSearchFilterSchema: Schema = new Schema<IUserSearchFilter>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'cln_users',
      required: true,
    },
    locationString: {
      type: String,
      trim: true,
      default: '',
    },
    lat: {
      type: Number,
      default: 0,
    },
    lng: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    minAge: {
      type: Number,
      default: 18,
    },
    maxAge: {
      type: Number,
      default: 99,
    },
    minHeight: {
      type: Number,
      default: 0,
    },
    maxHeight: {
      type: Number,
      default: 8,
    },
    looking: {
      type: [String],
      default: [],
    },
    otherLanguages: {
      type: [String],
      default: [],
    },
    education: { type: String, trim: true, default: '' },
    profession: { type: String, trim: true, default: '' },
    religion: { type: String, trim: true, default: '' },
    maritalStatus: { type: String, trim: true, default: '' },
    interestedIn: { type: String, trim: true, default: '' },
    //openTo: { type: String, trim: true, default: '' },
    // minPhotos: {
    //   type: Number,
    //   default: 0,
    // },
    allowOutOfDistance: {
      type: Boolean,
      default: false,
    },
    allowOutOfAgeRange: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'cln_user_search_filters',
  },
);

const USER_SEARCH_FILTER: Model<IUserSearchFilter> = model<IUserSearchFilter>('cln_user_search_filters', userSearchFilterSchema);

export default USER_SEARCH_FILTER;
