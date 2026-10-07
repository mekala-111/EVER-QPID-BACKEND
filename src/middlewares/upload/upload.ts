import { Request } from 'express';
import multer from 'multer';
import ERROR from '../web_server/http-error';

const excelFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
  try {
    console.log(file);
    if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
      cb(null, true);
    } else {
      cb(new ERROR.InvalidInputError('Please upload only excel file!'));
    }
  } catch (e) {
    cb(new ERROR.HttpError('Failed to verify mimetype!'));
  }
};

const storage = multer.memoryStorage();

const uploadFile = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: excelFilter });

export default uploadFile;
