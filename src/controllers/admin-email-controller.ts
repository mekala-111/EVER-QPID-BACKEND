import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import adminEmailService from '../services/admin-email-service';

const getAdminEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const emailRecord = await adminEmailService.getEmail();

    const apiResponse = new ApiResponse<{ email: string | null }>();
    apiResponse.message = 'Success';
    apiResponse.data = { email: emailRecord ? emailRecord.email : null };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const updateAdminEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const updatedEmail = await adminEmailService.updateEmail(email);

    const apiResponse = new ApiResponse<{ email: string }>();
    apiResponse.message = 'Admin email updated successfully';
    apiResponse.data = { email: updatedEmail.email };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e: any) {
    next(e);
  }
};

export default {
  getAdminEmail,
  updateAdminEmail,
};
