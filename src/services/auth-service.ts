import { AlcoholConsumption, IUser, SmokingHabit, WorkoutFrequency, ZodiacSign } from '../models/user/user-model';
import { tokenRepository, userRepository, otpRepository } from '../repositories';
import UserEntity from '../entities/user-entity';
import config from '../config/config';
import ERROR from '../middlewares/web_server/http-error';
import tokenService from './token-service';
import { validateRequiredField } from '../utils/validators';
import { Types } from 'mongoose';
import { generateOTP } from '../utils/generate-otp';
import { OTPEntity } from '../entities/otp-entity';
import { sendOTPEmail } from '../utils/email-service';
import authService from './auth-service';
import { AccountSuspendedError } from '../utils/accountSuspendError';
import BLACKLISTED_TOKEN from '../models/blankListedToken/blackListedToken';
import jwt from 'jsonwebtoken';

const findUserExists = async (obj: any) => {
  const findUser: IUser | null = await userRepository.findUserByMobile(obj.countryCode, obj.mobileNumber);
  if(findUser && findUser._id) {
    if (findUser.isActive === false || findUser.customerStatus === 'Deactive' || findUser.adminReport === true ) {
      throw new ERROR.NotFoundError('Your account has been suspended. Please contact support.');
    }
  }
  return !!(findUser && findUser._id);
};

const findUserNameExists = async (obj: any) => {
  const findUser: IUser | null = await userRepository.findUserName(obj.fullName);
  return !!(findUser && findUser._id);
};

const authUser = async (obj: any) => {
  const findUser: IUser | null = await userRepository.findUser(obj.countryCode, obj.mobileNumber);
  if (findUser) {
    if (findUser.isActive === false || findUser.customerStatus === 'Deactive' || findUser.adminReport === true) {
      throw new AccountSuspendedError();
    }

    await userRepository.updateLastActive(obj._id);

    return findUser;
  }
  const newUser = await createUser(obj);

  await userRepository.updateLastActive(obj._id);

  return newUser;
};

const createUser = async (obj: any) => {
  validateRequiredField(obj.fullName, 'fullName');
  validateRequiredField(obj.countryCode, 'countryCode');
  validateRequiredField(obj.mobileNumber, 'mobileNumber');
  validateRequiredField(obj.gender, 'gender');
  validateRequiredField(obj.locationString, 'locationString');
  validateRequiredField(obj.lat, 'lat');
  validateRequiredField(obj.lng, 'lng');

  const existingUser = await userRepository.findUserByUserName(obj.fullName);
  if (existingUser && existingUser._id) {
    throw new ERROR.DocumentExistsError('User with same name already exists!');
  }

  return await signUpUser(obj);
};

const logOut = async (refreshToken: string, accessToken: string) => {
  await tokenRepository.findTokenAndRemove(refreshToken, config.tokenTypes.REFRESH);

  const decoded = jwt.verify(accessToken, config.jwt.secret as string) as jwt.JwtPayload;

  await BLACKLISTED_TOKEN.create({
    token: accessToken,
    expiresAt: new Date(decoded.exp! * 1000),
  });
};

const refreshToken = async (refreshToken: string) => {
  const tokenData = await tokenRepository.findToken(refreshToken, config.tokenTypes.REFRESH);
  const userData = await userRepository.findUserById(tokenData.user);
  if (!userData) throw new ERROR.NotFoundError('User not found!');
  await tokenRepository.removeToken(tokenData._id);
  return await tokenService.generateAuthTokens(userData, 'user');
};

interface SignUpInput {
  fullName: string;
  email: string;
  gender: 'Man' | 'Women' | 'Other';
  zodiacSign?: string;
  alcoholConsumption?: string;
  smokingHabit?: string;
  workoutFrequency?: string;
  dateOfBirth: string | Date;
  profileImageUrl?: string;
  countryCode?: string;
  mobileNumber?: string;
  lat?: number;
  lng?: number;
  homeLat?: number;
  homeLng?: number;
  workLat?: number;
  workLng?: number;
  studyLat?: number;
  studyLng?: number;
  questLat?: number;
  questLng?: number;
  locationString?: string;
  relationshipGoals?: string[];
  relationshipStatus?: string;
  religion?: string;
  height?: number;
  otherLanguages?: string[];
  interests?: (string | Types.ObjectId)[];
  currentProfession?: string;
  companyName?: string;
  roleInCompany?: string;
  employmentType?: string;
  education?: string;
  collegeName?: string;
  graduationYear?: number;
  currentlyStudying?: boolean;
  profilePhotos?: string[];
  userType?: string;
  customerStatus?: 'Active' | 'Inactive' | 'Expired' | '';
  fcmTokens?: string[];
  createdUser?: string | null;
  createdAt?: Date | null;
  updatedUser?: string | null;
  updatedAt?: Date | null;
  isVerified?: boolean;
  adminReport?: boolean;
  aboutMe?: string;
  verificationIdNumber?: number;
  verificationIdType?: string;
  verificationImageUrl?: string;
  deleteReason?: string;
  feedBack?: string;
  isPaused?: boolean;
  notes?: {
    note: string;
    addedBy?: string | Types.ObjectId | null;
    createdAt?: Date;
  }[];
  unSubscribeSMS?: boolean;
  unSubscribeEmail?: boolean;
}

const signUpUser = async (obj: SignUpInput) => {
  const locationString = obj.locationString;

  const location = {
    type: 'Point',
    coordinates: [obj.lng || 0, obj.lat || 0],
  };

  // Home location
  const homeLocation = {
    type: 'Point',
    coordinates: [obj.homeLng || 0, obj.homeLat || 0],
  };

  // Work location
  const workLocation = {
    type: 'Point',
    coordinates: [obj.workLng || 0, obj.workLat || 0],
  };

  // Study location
  const studyLocation = {
    type: 'Point',
    coordinates: [obj.studyLng || 0, obj.studyLat || 0],
  };

  // Quest location
  const questLocation = {
    type: 'Point',
    coordinates: [obj.questLng || 0, obj.questLat || 0],
  };

  const userEntity = new UserEntity(
    true,
    obj.fullName || '',
    obj.email || '',
    obj.countryCode || '+91',
    obj.mobileNumber || '',
    obj.profileImageUrl || '',
    obj.gender || '',
    obj.zodiacSign || ZodiacSign.None,
    obj.alcoholConsumption ?? AlcoholConsumption.None,
    obj.smokingHabit ?? SmokingHabit.None,
    obj.workoutFrequency ?? WorkoutFrequency.None,
    new Date(obj.dateOfBirth),
    obj.aboutMe || '',
    location,
    homeLocation,
    workLocation,
    studyLocation,
    questLocation,
    locationString || '',
    obj.lat || 0,
    obj.lng || 0,
    obj.relationshipGoals || [],
    obj.relationshipStatus || '',
    obj.religion || '',
    obj.height ?? null,
    obj.otherLanguages || [],
    obj.interests || [],
    obj.currentProfession || '',
    obj.companyName || '',
    obj.roleInCompany || '',
    obj.employmentType || '',
    obj.education || '',
    obj.collegeName || '',
    obj.graduationYear || 0,
    obj.currentlyStudying || false,
    obj.profilePhotos || [],
    obj.userType || '',
    'Active',
    obj.fcmTokens || [],
    {
      home: null,
      work: null,
      study: null,
      quest: null,
    },
    false,
    null,
    null,
    obj.createdUser || null,
    new Date(),
    obj.updatedUser || null,
    obj.updatedAt || null,
    obj.isVerified || false,
    false,
    //'',
    0,
    '',
    '',
    '',
    '',
    obj.isPaused || false,
    obj.notes?.map((n) => ({
      note: n.note,
      addedBy: n.addedBy || null,
      createdAt: n.createdAt || new Date(),
    })) || [],
    obj.unSubscribeSMS || false,
    obj.unSubscribeEmail || false,
  );

  return await userRepository.createNewUser(userEntity);
};

/**
 *
 * @param email Sent otp
 */
const sendEmailOTP = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  //Generate a 5-digit OTP
  const otp = generateOTP();
  if (otp.length !== 5) {
    throw new ERROR.HttpError('Failed to generate a valid OTP');
  }

  const otpEntity = new OTPEntity(normalizedEmail, otp);

  const saved = await otpRepository.createOTP(otpEntity);
  console.log(saved);

  if (!saved || !saved._id) {
    throw new ERROR.HttpError('Failed to save OTP. Please try again.');
  }

  await sendOTPEmail(normalizedEmail, otp);
};

/**
 * Verify otp
 * @param email
 * @param otp
 * @returns
 */
const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  const record = await otpRepository.verifyOTP(email, otp);

  if (!record) return false;

  return true;
};

/**
 * Handle user authentication.
 * Sign up for new users and login for existing users.
 * @param { any } obj
 */

const userSignUpSocialMedia = async (obj: SignUpInput) => {
  const location = { type: 'Point', coordinates: [obj.lng || 0, obj.lat || 0] };
  const homeLocation = { type: 'Point', coordinates: [obj.homeLng || 0, obj.homeLat || 0] };
  const workLocation = { type: 'Point', coordinates: [obj.workLng || 0, obj.workLat || 0] };
  const studyLocation = { type: 'Point', coordinates: [obj.studyLng || 0, obj.studyLat || 0] };
  const questLocation = { type: 'Point', coordinates: [obj.questLng || 0, obj.questLat || 0] };

  const userEntity = new UserEntity(
    true,
    obj.fullName,
    obj.email,
    obj.countryCode || '+91',
    obj.mobileNumber || '',
    obj.profileImageUrl || '',
    obj.gender,
    ZodiacSign.None,
    obj.alcoholConsumption ?? AlcoholConsumption.None,
    obj.smokingHabit ?? SmokingHabit.None,
    obj.workoutFrequency ?? WorkoutFrequency.None,
    new Date(obj.dateOfBirth),
    obj.aboutMe || '',
    location,
    homeLocation,
    workLocation,
    studyLocation,
    questLocation,
    obj.locationString || '',
    obj.lat || 0,
    obj.lng || 0,
    obj.relationshipGoals || [],
    obj.relationshipStatus || '',
    obj.religion || '',
    obj.height ?? null,
    obj.otherLanguages || [],
    obj.interests || [],
    obj.currentProfession || '',
    obj.companyName || '',
    obj.roleInCompany || '',
    obj.employmentType || '',
    obj.education || '',
    obj.collegeName || '',
    obj.graduationYear || 0,
    obj.currentlyStudying || false,
    obj.profilePhotos || [],
    obj.userType || 'user',
    obj.customerStatus || 'Active',
    obj.fcmTokens || [],
    { home: null, work: null, study: null, quest: null },
    false,
    null,
    null,
    obj.createdUser || null,
    obj.createdAt || new Date(),
    obj.updatedUser || null,
    obj.updatedAt || null,
    obj.isVerified || false,
    obj.adminReport || false,
    obj.verificationIdNumber || 0,
    obj.verificationIdType || '',
    obj.verificationImageUrl || '',
    obj.deleteReason || '',
    obj.feedBack || '',
    obj.isPaused || false,
    //obj.notes || '',
    obj.notes?.map((n) => ({
      note: n.note,
      addedBy: n.addedBy || null,
      createdAt: n.createdAt || new Date(),
    })) || [],
    obj.unSubscribeSMS || false,
    obj.unSubscribeEmail || false,
  );

  return await userRepository.createNewUser(userEntity);
};

/**
 * Handle user sign up.
 * Sign up for new users
 * @param { any } obj
 */
const createUserEmail = async (obj: any) => {
  const findUser: IUser | null = await userRepository.findUserByEmail(obj.email);
  if (!findUser) {
    if (obj.userName) {
      const isExist = await userRepository.isExistUserName(obj.userName, '');
      if (isExist) throw new ERROR.UserExistsError('Username already exist');
    }
    let gender: 'Man' | 'Women' | 'Other';
    if (obj.gender === 'Man' || obj.gender === 'Women' || obj.gender === 'Other') {
      gender = obj.gender;
    } else {
      throw new ERROR.BadRequestError('Invalid gender value');
    }

    const newUser: IUser = await userSignUpSocialMedia({
      fullName: obj.fullName,
      email: obj.email,
      gender: gender,
      alcoholConsumption: obj.alcoholConsumption ?? AlcoholConsumption.None,
      smokingHabit: obj.smokingHabit ?? SmokingHabit.None,
      workoutFrequency: obj.workoutFrequency ?? WorkoutFrequency.None,
      dateOfBirth: obj.dateOfBirth,
      profileImageUrl: obj.profileImageUrl || '',
      countryCode: obj.countryCode || '+91',
      mobileNumber: obj.mobileNumber || '',
      lat: obj.lat || 0,
      lng: obj.lng || 0,
      homeLat: obj.homeLat || 0,
      homeLng: obj.homeLng || 0,
      workLat: obj.workLat || 0,
      workLng: obj.workLng || 0,
      studyLat: obj.studyLat || 0,
      studyLng: obj.studyLng || 0,
      questLat: obj.questLat || 0,
      questLng: obj.questLng || 0,
      locationString: obj.locationString || '',
      relationshipGoals: obj.relationshipGoals || [],
      relationshipStatus: obj.relationshipStatus || '',
      religion: obj.religion || '',
      height: obj.height ?? null,
      otherLanguages: obj.otherLanguages || [],
      interests: obj.interests || [],
      currentProfession: obj.currentProfession || '',
      companyName: obj.companyName || '',
      roleInCompany: obj.roleInCompany || '',
      employmentType: obj.employmentType || '',
      education: obj.education || '',
      collegeName: obj.collegeName || '',
      graduationYear: obj.graduationYear || 0,
      currentlyStudying: obj.currentlyStudying || false,
      profilePhotos: obj.profilePhotos || [],
      userType: 'user',
      customerStatus: 'Active',
      fcmTokens: obj.fcmTokens || [],
      createdUser: obj.createdUser || null,
      createdAt: new Date(),
      updatedUser: obj.updatedUser || null,
      updatedAt: obj.updatedAt || null,
      isVerified: obj.isVerified || false,
      adminReport: false,
      aboutMe: obj.aboutMe || '',
      verificationIdNumber: obj.verificationIdNumber || 0,
      verificationIdType: obj.verificationIdType || '',
      verificationImageUrl: obj.verificationImageUrl || '',
      deleteReason: obj.deleteReason || '',
      feedBack: obj.feedBack || '',
      isPaused: obj.isPaused || false,
      //notes: obj.notes || '',
      notes:
        obj.notes?.map((n: any) => ({
          note: n.note,
          addedBy: n.addedBy || null,
          createdAt: n.createdAt || new Date(),
        })) || [],
      unSubscribeSMS: obj.unSubscribeSMS || false,
      unSubscribeEmail: obj.unSubscribeEmail || false,
    });

    return newUser;
  } else {
    throw new ERROR.DocumentExistsError('Email already taken!');
  }
};

/**
 * Handle user authentication.
 * Sign up for new users and login for existing users.
 * @param { any } obj
 */
const emailLogin = async (obj: any) => {
  const findUser: IUser | null = await userRepository.findUserByEmail(obj.email);

  if (!findUser) throw new ERROR.NotFoundError('User not found');

  const isVerified = await authService.verifyOtp(obj.email, obj.otp);
  if (!isVerified) throw new ERROR.InvalidInputError('Invalid OTP');

  return findUser;
};

const findUserExistsByEmail = async (obj: any) => {
  const foundUser: IUser | null = await userRepository.findUserByEmail2(obj.email);
   if(foundUser && foundUser._id) {
    if (foundUser.isActive === false || foundUser.customerStatus === 'Deactive' || foundUser.adminReport === true ) {
      throw new ERROR.NotFoundError('Your account has been suspended. Please contact support.');
    }
  }
  return !!(foundUser && foundUser._id);
};

export default {
  findUserExists,
  findUserNameExists,
  authUser,
  createUser,
  logOut,
  refreshToken,
  verifyOtp,
  sendEmailOTP,
  createUserEmail,
  emailLogin,
  findUserExistsByEmail,
};
