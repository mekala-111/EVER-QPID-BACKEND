import moment, { Moment } from 'moment';
import config from '../config/config';
import jwt from 'jsonwebtoken';
import { tokenRepository } from '../repositories';

/**
 * Generate auth tokens
 * @param { IUser } user
 * @returns { Promise<Object> }
 */
const generateAuthTokens = async (user: any, role: string): Promise<object> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user._id.toString(), role, accessTokenExpires, config.tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user._id.toString(), role, refreshTokenExpires, config.tokenTypes.REFRESH);
  await saveToken(refreshToken, user._id.toString(), refreshTokenExpires, config.tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @returns {string}
 */
const generateToken = (userId: string, role: string, expires: Moment, type: string): string => {
  const payload = {
    sub: userId,
    role,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, config.jwt.secret as string);
};

/**
 * Save token
 * @param { string } token
 * @param { ObjectId } userId
 * @param { Moment } expires
 * @param { string } type
 * @param { boolean } [ blacklisted ]
 * @returns {Promise<void>}
 */
const saveToken = async (token: string, userId: string, expires: Moment, type: string, blacklisted: boolean = false): Promise<void> => {
  await tokenRepository.createToken(token, userId, expires.toDate(), type, blacklisted);
};

export default {
  generateAuthTokens,
};
