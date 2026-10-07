import { Request, Response, NextFunction } from 'express';
import { blockService, chatMessageService, matchingService, messageService } from '../services';
import ApiResponse from '../utils/api-response';
import { IChatMessage } from '../models/chatMessage/chatMessage-model';
import ERROR from '../middlewares/web_server/http-error';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import { RecentChatsResult } from '../types/chat';
import BLOCK from '../models/block/block';

const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, profileId, content } = req.body;
    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }

    if (!profileId || !content) {
      throw new ERROR.BadRequestError('Missing required fields');
    }

    const message = await messageService.sendMessage(userId, profileId, 'hello');

    // Create the ApiResponse object
    const apiResponse: ApiResponse<{ message: any }> = new ApiResponse<{ message: any }>();
    apiResponse.message = 'Message sent successfully';
    apiResponse.data = { message }; // Provide the message data in the response
    apiResponse.statusCode = 201;

    res.status(apiResponse.statusCode).json(apiResponse);
  } catch (error) {
    next(error);
  }
};
/**
 * GET /get-all-chat-messages
 * /**
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getUserChatWith = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const receiverId = req.params.receiverId;
    //const { pageNumber, pageSize } = parsePagination(req);
    const senderId = userId;
    const isMatch: boolean = await matchingService.findMutualMatch(userId, receiverId);
    const isBlock: boolean = !!(await blockService.findBlock(userId, receiverId));
    const isOppositeBlock: boolean = !!(await blockService.findBlock(receiverId, userId));
    const { data, totalCount } = await chatMessageService.getMessagesBetweenUsers(senderId, receiverId);

    await chatMessageService.markChatAsRead(senderId, receiverId);

    const apiResponse = new ApiResponse<{
      messages: IChatMessage[];
      totalCount: number;
      //hasNext: boolean;
      isMatch: boolean;
      isBlock: boolean;
      isOppositeBlock: boolean;
    }>();

    apiResponse.message = 'Chat messages fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = {
      messages: data,
      totalCount,
      //hasNext,
      isMatch,
      isBlock,
      isOppositeBlock,
    };

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /getRecentChats
 * /**
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getRecentChats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.body.userId;
    const search = (req.query.search as string) || '';
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const recentChats: RecentChatsResult = await chatMessageService.getRecentChats(userId, search, Number(pageNumber), Number(pageSize));
    const apiResponse = new ApiResponse();
    apiResponse.message = 'Recent chat users fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = recentChats;
    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Clear chat
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const clearChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;
    const chatWith = req.params.chatWith;
    if (!userId) {
      return next(new ERROR.AuthorizationError('Unauthorized'));
    }
    // Call the service to clear chat
    await chatMessageService.deleteMessages(userId, chatWith);

    const apiResponse = new ApiResponse<null>();
    apiResponse.message = 'Chat cleared successfully!';
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getChatLogsByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const recentChats = await chatMessageService.getRecentChatsByAdmin(userId);
    const apiResponse = new ApiResponse();
    apiResponse.message = 'Recent chat users fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = recentChats;
    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const blockHostChatUser = async (req: Request, res: Response) => {
  const { hostId, userId, selectedReasons } = req.body;

  await BLOCK.findOneAndUpdate(
    { blockedBy: hostId, blockedAccount: userId },
    {
      blockedBy: hostId,
      blockedAccount: userId,
      selectedReasons,
      dateBlocked: new Date(),
      createdUser: hostId,
    },
    { upsert: true, new: true },
  );

  res.json({
    status: true,
    message: 'User blocked from host chat successfully',
  });
};

const getRecentChatsHost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const search = (req.query.search as string) || '';
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const recentChats: RecentChatsResult = await chatMessageService.getRecentChats(userId, search, Number(pageNumber), Number(pageSize));
    const apiResponse = new ApiResponse();
    apiResponse.message = 'Recent chat users fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = recentChats;
    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getChatHistoryForAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hostId, userId } = req.params;

    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await chatMessageService.getChatHistoryForAdmin(hostId, userId, pageNumber, pageSize);

    res.status(200).json({
      statusCode: 200,
      message: 'Chat history fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getRecentChatsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || '';
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await chatMessageService.getRecentChatsForAdmin(search, pageNumber, pageSize);

    res.status(200).json({
      statusCode: 200,
      message: 'Recent chats fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const fetchHostUserChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const { hostId, userId } = req.params;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const chats = await chatMessageService.getHostUserChats({ hostId, userId, pageNumber, pageSize });

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Host-user chat history fetched successfully';
    apiResponse.data = chats;

    res.status(200).json(apiResponse);
  } catch (err) {
    next(err);
  }
};

export default {
  getUserChatWith,
  getRecentChats,
  clearChatHistory,
  getChatLogsByAdmin,
  blockHostChatUser,
  getRecentChatsHost,
  getChatHistoryForAdmin,
  getRecentChatsAdmin,
  fetchHostUserChats,
  sendMessage,
};
