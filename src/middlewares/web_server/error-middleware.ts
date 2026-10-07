import { Request, Response, NextFunction } from 'express';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Error Middleware:::::::::', err);
    const statusCode = err.statusCode || 500;
    const status = false;
    const message = err['message'] || err['error']['description'] || 'Internal Server Error';
    res.status(err.statusCode != 500 ? 200 : 500).json({ status, statusCode, message });
  } catch (e) {
    console.log(e);
  }
};

export default errorMiddleware;
