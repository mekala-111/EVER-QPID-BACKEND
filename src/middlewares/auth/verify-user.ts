import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ERROR from '../web_server/http-error';
import config from '../../config/config';
import USER from '../../models/user/user';
import BLACKLISTED_TOKEN from '../../models/blankListedToken/blackListedToken';

/**
 * @function verifyUser
 * @param req
 * @param res
 * @param next
 */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) throw new ERROR.BadRequestError('Authorization Error: Token missing!');

    const blacklisted = await BLACKLISTED_TOKEN.findOne({ token });
    if (blacklisted) {
      throw new ERROR.AuthorizationError('Session expired. Please login again.');
    }

    const payload: any = await new Promise((resolve, reject) => {
      jwt.verify(token, config.jwt.secret as string, (err, decoded) => {
        if (err) reject(new ERROR.AuthorizationError('Authorization Error: Token verification failed!'));
        resolve(decoded);
      });
    });

    const userId = payload.sub;

    const user = await USER.findById(userId);
    if (!user) throw new ERROR.NotFoundError('User not found.');

    if (!user.isActive || user.customerStatus === 'Deactive' || user.adminReport) {
      throw new ERROR.AuthorizationError('Your account has been suspended. Please contact support.');
    }

    req.body.userId = userId;
    next();
  } catch (e) {
    next(e);
  }
};
