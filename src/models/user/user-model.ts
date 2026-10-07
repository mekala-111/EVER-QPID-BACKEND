import { Document, Types } from 'mongoose';

export enum SubscribedPlanStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Expired = 'Expired',
  None = '',
}

export enum ZodiacSign {
  Aries = 'Aries',
  Taurus = 'Taurus',
  Gemini = 'Gemini',
  Cancer = 'Cancer',
  Leo = 'Leo',
  Virgo = 'Virgo',
  Libra = 'Libra',
  Scorpio = 'Scorpio',
  Sagittarius = 'Sagittarius',
  Capricorn = 'Capricorn',
  Aquarius = 'Aquarius',
  Pisces = 'Pisces',
  None = '',
}

export enum SmokingHabit {
  socialSmoker = 'Social smoker',
  SmokerWhenDrinking = 'Smoker when drinking',
  NonSmoker = 'Non-smoker',
  Smoker = 'Smoker',
  TryingToQuit = 'Trying to quit',
  None = '',
}

export enum WorkoutFrequency {
  Everyday = 'Everyday',
  Often = 'Often',
  Sometimes = 'Sometimes',
  Never = 'Never',
  None = '',
}

export enum AlcoholConsumption {
  NotForMe = 'Not for me',
  Sober = 'Sober',
  SoberCurious = 'Sober curious',
  OnSpecialOccasions = 'On special occasions',
  SociallyOnWeekends = 'Socially on weekends',
  MostlyNights = 'Most Nights',
  None = '',
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  fullName: string;
  email: string;
  countryCode: string;
  mobileNumber: string;
  profileImageUrl: string;
  gender: 'Man' | 'Women' | 'Other';
  zodiacSign: ZodiacSign;
  alcoholConsumption: AlcoholConsumption;
  smokingHabit: SmokingHabit;
  workoutFrequency: WorkoutFrequency;
  dateOfBirth: Date;
  aboutMe: string;
  location: object;
  homeLocation: object;
  workLocation: object;
  studyLocation: object;
  questLocation: object;
  locationString: string;
  lat: number;
  lng: number;
  relationshipGoals: string[];
  relationshipStatus: string;
  religion: string;
  //caste?: string;
  //subCaste?: string;
  //additionalCasteInfo?: string;
  //otherReligionInfo?: string;
  height: number | null;
  otherLanguages: string[];
  interests: string[];
  //interests: Types.ObjectId[];
  currentProfession: string;
  companyName: string;
  roleInCompany: string;
  employmentType: string;
  education: string;
  collegeName: string;
  graduationYear?: number;
  currentlyStudying?: boolean;
  profilePhotos: string[];
  userType: string;
  customerStatus: string;
  fcmTokens: string[];
  //rewardPoints: number;
  //availableCommentsCount: number;
  hiddenContacts?: string[];
  subscribedPlanStatus: 'Active' | 'Inactive' | 'Expired' | 'None';
  clanActivity: {
    home: Date | null;
    work: Date | null;
    study: Date | null;
    quest: Date | null;
  };
  isHostProfile: boolean;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
  isVerified: boolean;
  adminReport: boolean;
  //aboutMe: string;
  verificationIdNumber: number;
  verificationIdType: string;
  verificationImageUrl: string;
  deleteReason: string;
  feedBack: string;
  isPaused: boolean;
  //notes: string;
  notes: {
    note: string;
    addedBy: Types.ObjectId | null;
    createdAt: Date;
  }[];
  unSubscribeSMS: boolean;
  unSubscribeEmail: boolean;
  assignedEmployee?: Types.ObjectId | null;
  createdByAdmin?: Types.ObjectId | null;

  subscriptionId?: string | Types.ObjectId;
  isOnline?: boolean;
  lastActive?: Date;
  isActive?: boolean;
  date?: Date;
}
