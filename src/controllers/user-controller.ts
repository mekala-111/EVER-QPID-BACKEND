import { Request, Response } from 'express';
import userService from '../services/user-service';

const getUserWithPreferencesController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const result = await userService.getUserWithPreferences(userId);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export default { getUserWithPreferencesController };
