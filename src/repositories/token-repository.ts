import { IToken } from '../models/token/token-model';
import TOKEN from '../models/token/token';
import ERROR from '../middlewares/web_server/http-error';
import { Types } from 'mongoose';

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<IToken>}
 */

const createToken = async (token: string, userId: string, expires: Date, type: string, blacklisted: boolean): Promise<IToken> => {
  const tokenDoc = await TOKEN.create({
    token,
    user: userId,
    expires: expires,
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Find token and remove
 * @param { string }token
 * @param { string }type
 */
const findTokenAndRemove = async (token: string, type: string) => {
  const refreshTokenDoc = await TOKEN.findOne({ token: token, type: type, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ERROR.NotFoundError('Token Not found!');
  }
  await TOKEN.deleteOne({ _id: refreshTokenDoc._id });
};

/**
 * Find token
 * @param { string } token
 * @param { string } type
 * @returns
 */
const findToken = async (token: string, type: string) => {
  const refreshTokenDoc = await TOKEN.findOne({ token: token, type: type, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ERROR.NotFoundError('Token Not found!');
  }
  return refreshTokenDoc;
};

/**
 * Remove token
 * @param { Types.ObjectId } id
 */
const removeToken = async (id: Types.ObjectId) => {
  await TOKEN.deleteOne({ _id: id });
};

export default {
  createToken,
  findTokenAndRemove,
  findToken,
  removeToken,
};
