import { Schema, model, Types } from 'mongoose';
import { AlcoholConsumption, IUser, SmokingHabit, WorkoutFrequency, ZodiacSign } from './user-model';

const userSchema = new Schema<IUser>({
  documentStatus: { type: Boolean, default: true },

  fullName: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  countryCode: { type: String, trim: true },
  mobileNumber: { type: String, trim: true },
  profileImageUrl: { type: String, default: '' },
  gender: { type: String, enum: ['Man', 'Women', 'Other'], required: true },
  zodiacSign: { type: String, enum: Object.values(ZodiacSign) },
  alcoholConsumption: { type: String, enum: Object.values(AlcoholConsumption) },
  smokingHabit: { type: String, enum: Object.values(SmokingHabit) },
  workoutFrequency: { type: String, enum: Object.values(WorkoutFrequency) },
  dateOfBirth: { type: Date, required: true },
  aboutMe: { type: String, default: '' },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  homeLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
  },

  workLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
  },

  studyLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
  },

  // questLocations: [
  //   {
  //     type: {
  //       type: String,
  //       enum: ['Point'],
  //       default: 'Point',
  //     },
  //     coordinates: {
  //       type: [Number],
  //       default: [0, 0],
  //     },
  //     title: { type: String, default: '' },
  //     city: { type: String, default: '' },
  //     state: { type: String, default: '' },
  //   },
  // ],
  questLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
  },

  locationString: { type: String, default: '' },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },

  relationshipGoals: [{ type: String }],
  relationshipStatus: { type: String, default: '' },
  religion: { type: String, default: '' },
  //caste: { type: String, default: '' },
  //subCaste: { type: String, default: '' },
  //additionalCasteInfo: { type: String, default: '' },
  //otherReligionInfo: { type: String, default: '' },

  height: { type: Number, default: null },

  otherLanguages: [{ type: String }],

  //interests: [{ type: Types.ObjectId, ref: 'cln_interest' }],
  interests: [{ type: String }],

  currentProfession: { type: String, default: '' },
  companyName: { type: String, default: '' },
  roleInCompany: { type: String, default: '' },
  employmentType: { type: String, default: '' },

  education: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  graduationYear: { type: Number },
  currentlyStudying: { type: Boolean, default: false },

  profilePhotos: [{ type: String, default: [] }],

  userType: { type: String, default: 'user' },
  customerStatus: { type: String, enum: ['Active', 'Deactive'], default: 'Active' },

  fcmTokens: [{ type: String }],
  hiddenContacts: [{ type: String }],

  subscribedPlanStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired', 'None'],
    default: 'None',
  },
  clanActivity: {
    home: { type: Date, default: null },
    work: { type: Date, default: null },
    study: { type: Date, default: null },
    quest: { type: Date, default: null },
  },

  isHostProfile: { type: Boolean, default: false },

  createdUser: { type: Schema.Types.ObjectId, ref: 'cln_user', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedUser: { type: Schema.Types.ObjectId, ref: 'cln_user', default: null },
  updatedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  adminReport: { type: Boolean, default: false },
  //aboutMe: { type: String, default: '' },
  verificationIdNumber: { type: Number, default: 0 },
  verificationIdType: { type: String, default: '' },
  verificationImageUrl: { type: String, default: '' },
  deleteReason: { type: String, default: '' },
  feedBack: { type: String, default: '' },
  isPaused: { type: Boolean, default: false },
  //notes: { type: String, default: '' },
  notes: [
    {
      note: { type: String, required: true },
      addedBy: { type: Schema.Types.ObjectId, ref: 'cln_admin', default: null },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  unSubscribeSMS: { type: Boolean, default: false },
  unSubscribeEmail: { type: Boolean, default: false },
  assignedEmployee: { type: Schema.Types.ObjectId, ref: 'cln_employee', default: null },
  createdByAdmin: { type: Schema.Types.ObjectId, ref: 'cln_admin', default: null },
  subscriptionId: { type: Types.ObjectId, ref: 'Subscription', default: null },
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  date: { type: Date, default: Date.now },
});

userSchema.index({ location: '2dsphere' });
userSchema.index({ homeLocation: '2dsphere' });
userSchema.index({ workLocation: '2dsphere' });
userSchema.index({ studyLocation: '2dsphere' });
userSchema.index({ questLocation: '2dsphere' });

userSchema.pre<IUser>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

//userSchema.index({ currentLat: 1, currentLng: 1 });

const USER = model<IUser>('cln_user', userSchema);
export default USER;
