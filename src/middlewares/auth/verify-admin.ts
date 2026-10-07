import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ERROR from '../web_server/http-error';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) return next(new ERROR.BadRequestError('Authorization Error: Token missing!'));

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    if (decoded.role !== 'admin') {
      return next(new ERROR.AuthorizationError('Only admins can access this route'));
    }

    req.user = { id: decoded.id, role: 'admin' };
    next();
  } catch (e) {
    next(e);
  }
};
