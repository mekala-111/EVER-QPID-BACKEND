import { Request, Response } from 'express';
import messageService from '../services/message-service';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import ERROR from '../middlewares/web_server/http-error';
import ApiResponse from '../utils/api-response';

const sendMessage = async (req: AuthRequest, res: Response) => {
  const apiResponse = new ApiResponse();

  try {
    const adminId = req.user?.id;
    if (!adminId) {
      apiResponse.message = 'Admin not authenticated';
      apiResponse.statusCode = 401;
      return res.status(401).json(apiResponse);
    }

    const { userId, content } = req.body;
    if (!userId || !content) {
      apiResponse.message = 'userId and content are required';
      apiResponse.statusCode = 400;
      return res.status(400).json(apiResponse);
    }

    const message = await messageService.sendMessage(adminId, userId, content);

    apiResponse.message = 'Message sent successfully';
    apiResponse.statusCode = 201;
    apiResponse.data = message;
    return res.status(201).json(apiResponse);
  } catch (err: any) {
    apiResponse.message = err.message || 'Internal server error';
    apiResponse.statusCode = 500;
    return res.status(500).json(apiResponse);
  }
};

const getUserMessages = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      throw new ERROR.AuthorizationError('Unauthorized');
    }

    const messages = await messageService.getUserMessages(userId);
    res.status(200).json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      throw new ERROR.AuthorizationError('Unauthorized');
    }
    const { messageId } = req.params;
    const message = await messageService.readMessage(messageId, userId);
    if (!message) res.status(404).json({ success: false, message: 'Message not found' });
    res.status(200).json({ success: true, data: message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export default { sendMessage, getUserMessages, markAsRead };
