import { Types } from 'mongoose';

class UserEntity {
  documentStatus: boolean;

  // Basic Info
  fullName: string;
  email: string;
  countryCode: string;
  mobileNumber: string;
  profileImageUrl: string;
  gender: 'Man' | 'Women' | 'Other';
  zodiacSign: string;
  alcoholConsumption: string;
  smokingHabit: string;
  workoutFrequency: string;
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

  // Relationship & Preferences
  relationshipGoals: string[];
  relationshipStatus: string;

  // Religion
  religion: string;
  caste?: string;
  subCaste?: string;
  additionalCasteInfo?: string;
  otherReligionInfo?: string;

  // Height
  height: number | null;

  // Language
  otherLanguages: string[];

  // Hobbies / Interests
  interests: (string | Types.ObjectId)[];

  // Profession
  currentProfession: string;
  companyName: string;
  roleInCompany: string;
  employmentType: string;

  // Education
  education: string;
  collegeName: string;
  graduationYear?: number;
  currentlyStudying?: boolean;

  // Photo Uploads
  profilePhotos: string[];

  // App & System Data
  userType: string;
  customerStatus: string;
  fcmTokens: string[];
  //rewardPoints: number;
  clanActivity: {
    home: Date | null;
    work: Date | null;
    study: Date | null;
    quest: Date | null;
  };
  isHostProfile: boolean;
  assignedEmployee?: string | Types.ObjectId | null;
  createdByAdmin?: string | Types.ObjectId | null;
  createdUser: string | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;
  isVerified: boolean;
  adminReport: boolean;
  verificationIdNumber: number;
  verificationIdType: string;
  verificationImageUrl: string;
  deleteReason: string;
  feedBack: string;
  isPaused: boolean;
  //aboutMe: string;
  // notes: string;
  notes: {
    note: string;
    addedBy?: string | Types.ObjectId | null;
    createdAt: Date;
  }[];
  unSubscribeSMS: boolean;
  unSubscribeEmail: boolean;
  constructor(
    documentStatus: boolean,
    fullName: string,
    email: string,
    countryCode: string,
    mobileNumber: string,
    profileImageUrl: string,
    gender: 'Man' | 'Women' | 'Other',
    zodiacSign: string,
    alcoholConsumption: string,
    smokingHabit: string,
    workoutFrequency: string,
    dateOfBirth: Date,
    aboutMe: string,
    location: object,
    homeLocation: object,
    workLocation: object,
    studyLocation: object,
    questLocation: object,
    locationString: string,
    lat: number,
    lng: number,
    relationshipGoals: string[],
    relationshipStatus: string,
    religion: string,
    //caste: string,
    //subCaste: string,
    //additionalCasteInfo: string,
    //otherReligionInfo: string,
    height: number | null,
    otherLanguages: string[],
    interests: (string | Types.ObjectId)[],
    currentProfession: string,
    companyName: string,
    roleInCompany: string,
    employmentType: string,
    education: string,
    collegeName: string,
    graduationYear: number,
    currentlyStudying: boolean,
    profilePhotos: string[],
    userType: string,
    customerStatus: string,
    fcmTokens: string[],
    //rewardPoints: number,
    clanActivity: { home: Date | null; work: Date | null; study: Date | null; quest: Date | null },
    isHostProfile: boolean,
    assignedEmployee: string | Types.ObjectId | null,
    createdByAdmin: string | Types.ObjectId | null,
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
    isVerified: boolean,
    adminReport: boolean,
    //aboutMe: string,
    verificationIdNumber: number,
    verificationIdType: string,
    verificationImageUrl: string,
    deleteReason: string,
    feedBack: string,
    isPaused: boolean,
    //notes: string,
    notes: {
      note: string;
      addedBy?: string | Types.ObjectId | null;
      createdAt: Date;
    }[],
    unSubscribeSMS: boolean,
    unSubscribeEmail: boolean,
  ) {
    this.documentStatus = documentStatus;
    this.fullName = fullName;
    this.email = email;
    this.countryCode = countryCode;
    this.mobileNumber = mobileNumber;
    this.profileImageUrl = profileImageUrl;
    this.gender = gender;
    this.zodiacSign = zodiacSign;
    this.alcoholConsumption = alcoholConsumption;
    this.smokingHabit = smokingHabit;
    this.workoutFrequency = workoutFrequency;
    this.dateOfBirth = dateOfBirth;
    this.aboutMe = aboutMe;
    this.location = location;
    this.homeLocation = homeLocation;
    this.workLocation = workLocation;
    this.studyLocation = studyLocation;
    this.questLocation = questLocation;
    this.locationString = locationString;
    this.lat = lat;
    this.lng = lng;
    this.relationshipGoals = relationshipGoals;
    this.relationshipStatus = relationshipStatus;
    this.religion = religion;
    //this.caste = caste;
    //this.subCaste = subCaste;
    //this.additionalCasteInfo = additionalCasteInfo;
    //this.otherReligionInfo = otherReligionInfo;
    this.height = height;
    this.otherLanguages = otherLanguages;
    this.interests = interests;
    this.currentProfession = currentProfession;
    this.companyName = companyName;
    this.roleInCompany = roleInCompany;
    this.employmentType = employmentType;
    this.education = education;
    this.collegeName = collegeName;
    this.graduationYear = graduationYear;
    this.currentlyStudying = currentlyStudying;
    this.profilePhotos = profilePhotos;
    this.userType = userType;
    this.customerStatus = customerStatus;
    this.fcmTokens = fcmTokens;
    //this.rewardPoints = rewardPoints;
    this.clanActivity = clanActivity;
    this.isHostProfile = isHostProfile;

    this.unSubscribeEmail = unSubscribeEmail;
    this.assignedEmployee = assignedEmployee;
    this.createdByAdmin = createdByAdmin;

    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
    this.isVerified = isVerified;
    this.adminReport = adminReport;
    //this.aboutMe = aboutMe;
    this.verificationIdNumber = verificationIdNumber;
    this.verificationIdType = verificationIdType;
    this.verificationImageUrl = verificationImageUrl;
    this.deleteReason = deleteReason;
    this.feedBack = feedBack;
    this.isPaused = isPaused;
    this.notes = notes;
    this.unSubscribeSMS = unSubscribeSMS;
    this.unSubscribeEmail = unSubscribeEmail;
  }
}

export default UserEntity;
