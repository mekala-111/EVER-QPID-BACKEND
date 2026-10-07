import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ERROR from '../web_server/http-error';
import EMPLOYEE from '../../models/employee/employee';

export interface EmployeeRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

export const verifyEmployee = async (req: EmployeeRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) throw new ERROR.BadRequestError('Token missing');

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    const employee = await EMPLOYEE.findById(decoded.id);
    if (!employee) throw new ERROR.NotFoundError('Employee not found');

    req.user = { id: employee._id.toString(), role: 'employee' };
    next();
  } catch (err) {
    next(err);
  }
};
