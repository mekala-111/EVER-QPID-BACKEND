import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import { employeeService, hostService } from '../services';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import USER from '../models/user/user';
import ERROR from '../middlewares/web_server/http-error';
import { EmployeeRequest } from '../middlewares/auth/verify-employee';
import mongoose from 'mongoose';

const createHostProfileController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj = req.body;

    const assignedEmployeeId = obj.assignedEmployeeId;
    const adminId = obj.adminId;

    const newHostUser = await hostService.createHostProfile(obj, assignedEmployeeId, adminId);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Host profile created successfully!';
    apiResponse.data = newHostUser;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const updateHostProfileController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const obj = req.body;
    const assignedEmployeeId = obj.assignedEmployeeId;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    const updatedHost = await hostService.updateHostProfile(hostId, obj, assignedEmployeeId, adminId);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Host profile updated successfully!';
    apiResponse.data = updatedHost;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getAllHostsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pageNumber: number = parseInt(req.query.pageNumber as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 10;
    const search: string = (req.query.search as string) || '';
    const status: 'Active' | 'Inactive' = (req.query.status as any) || undefined;
    const assignedEmployeeId: string | undefined = req.query.assignedEmployeeId as string | undefined;

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const { hosts, totalCount, activeCount, inactiveCount, hasNext } = await hostService.getAllHosts({
      pageNumber,
      pageSize,
      search,
      status,
      assignedEmployeeId,
      startDate,
      endDate,
    });

    const apiResponse = new ApiResponse<{ hosts: any[]; totalCount: number; activeCount: number; inactiveCount: number; hasNext: boolean }>();
    apiResponse.message = 'Hosts retrieved successfully!';
    apiResponse.data = { hosts, totalCount, activeCount, inactiveCount, hasNext };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getHostDetailsController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  const apiResponse = new ApiResponse<any>();

  try {
    const hostId = req.params.hostId;

    if (!hostId) {
      apiResponse.status = false;
      apiResponse.statusCode = 400;
      apiResponse.message = 'Host ID is required';
      return res.status(400).json(apiResponse);
    }

    const host = await hostService.getHostDetails({ hostId });

    if (!host) {
      apiResponse.status = false;
      apiResponse.statusCode = 404;
      apiResponse.message = 'Host not found';
      return res.status(404).json(apiResponse);
    }

    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Host details retrieved successfully!';
    apiResponse.data = host;

    return res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteHostController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hostId } = req.params;
    const adminId = req.user?.id;

    const deletedHost = await hostService.deleteHost(hostId, adminId!);

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Host deleted successfully!';
    apiResponse.data = deletedHost;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getHostPhotosController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const hostId = req.params.hostId;

    const host = await hostService.getHostPhotos(hostId);

    const apiResponse = new ApiResponse<any>();

    if (!host) {
      apiResponse.status = false;
      apiResponse.statusCode = 404;
      apiResponse.message = 'Host not found';
      return res.status(404).json(apiResponse);
    }

    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Host photos retrieved successfully!';
    apiResponse.data = host.profilePhotos || [];

    return res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getHostMachingController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const { matches, totalCount, hasNext } = await hostService.getHostMatching({ hostId, pageNumber, pageSize });

    const apiResponse = new ApiResponse<any>();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Received likes profiles retrieved successfully!';
    apiResponse.data = { matches, totalCount, hasNext };

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
    return;
  }
};

const getHostSentLikesController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    const sentLikes = await hostService.getHostSentLikes({ hostId });

    const apiResponse = new ApiResponse<any>();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Sent likes retrieved successfully!';
    apiResponse.data = sentLikes;

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
    return;
  }
};

const sendLikeController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const { toUserId } = req.body; // the user to whom the like is sent

    if (!toUserId) {
      const apiResponse = new ApiResponse();
      apiResponse.status = false;
      apiResponse.statusCode = 400;
      apiResponse.message = 'toUserId is required';
      res.status(400).json(apiResponse);
    }

    const result = await hostService.sendLike({ hostId, toUserId });

    const apiResponse = new ApiResponse();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Like sent successfully!';
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getUsersForHostController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const host = await USER.findOne({ _id: hostId, isHostProfile: true });
    if (!host) {
      const apiResponse = new ApiResponse<any>();
      apiResponse.status = false;
      apiResponse.statusCode = 404;
      apiResponse.message = 'Host not found';
      res.status(404).json(apiResponse);
    }

    const { users, totalCount, hasNext } = await hostService.getUsersForHost({ pageNumber, pageSize });

    const apiResponse = new ApiResponse<any>();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Users retrieved successfully!';
    apiResponse.data = { users, totalCount, hasNext };

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
    return;
  }
};

const getAssignedHosts = async (req: EmployeeRequest, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    const hosts = await employeeService.getHostsByEmployee(employeeId);

    const apiResponse = new ApiResponse();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Assigned hosts fetched successfully';
    apiResponse.data = hosts;

    res.status(200).json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const getHostRecentChats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId, hostId } = req.params;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await hostService.getHostRecentChats({
      employeeId,
      hostId,
      pageNumber,
      pageSize,
    });

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Host recent chats fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getHostRecentChatsListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, hostId } = req.params;
    console.log('req.params.hostId:', req.params.hostId);
    console.log('typeof req.params.hostId:', typeof req.params.hostId);

    const locationString = req.query.locationString as string | undefined;
    const otherLanguages = req.query.otherLanguages ? (req.query.otherLanguages as string).split(',') : undefined;

    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await hostService.getHostRecentChatsListService({
      employeeId,
      hostId,
      pageNumber,
      pageSize,
      locationString,
      otherLanguages,
    });

    res.status(200).json({
      message: 'Host recent chats fetched successfully!',
      statusCode: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markHostConversationReadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hostId, userId } = req.params;

    await hostService.markHostConversationReadService(hostId, userId);

    res.status(200).json({
      message: 'Conversation marked as read successfully!',
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

const getRecentChats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employeeId = req.user!.id;
    const { hostId } = req.params;

    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      res.status(400).json({
        status: false,
        statusCode: 400,
        message: 'Invalid host ID',
      });
    }

    const locationString = req.query.locationString as string | undefined;
    const otherLanguages = req.query.otherLanguages ? (req.query.otherLanguages as string).split(',') : undefined;

    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const chats = await hostService.fetchRecentChats({
      hostId,
      pageNumber,
      pageSize,
      locationString,
      otherLanguages,
    });

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: 'Recent chats fetched successfully',
      data: chats,
    });
    return;
  } catch (err) {
    next(err);
  }
};

const getUsersForHostControllerForEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const host = await USER.findOne({ _id: hostId, isHostProfile: true });
    if (!host) {
      const apiResponse = new ApiResponse<any>();
      apiResponse.status = false;
      apiResponse.statusCode = 404;
      apiResponse.message = 'Host not found';
      res.status(404).json(apiResponse);
    }

    const { users, totalCount, hasNext } = await hostService.getUsersForHostByEmployee({ pageNumber, pageSize, hostId });

    const apiResponse = new ApiResponse<any>();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Users retrieved successfully!';
    apiResponse.data = { users, totalCount, hasNext };

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
    return;
  }
};

const sendLikeControllerByEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const { toUserId } = req.body;

    if (!toUserId) {
      const apiResponse = new ApiResponse();
      apiResponse.status = false;
      apiResponse.statusCode = 400;
      apiResponse.message = 'toUserId is required';
      res.status(400).json(apiResponse);
    }

    const result = await hostService.sendLike({ hostId, toUserId });

    const apiResponse = new ApiResponse();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'Like sent successfully!';
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getAllHostsControllerByEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pageNumber: number = parseInt(req.query.pageNumber as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 10;
    const search: string = (req.query.search as string) || '';
    const status: 'Active' | 'Inactive' = (req.query.status as any) || undefined;
    const assignedEmployeeId: string | undefined = req.query.assignedEmployeeId as string | undefined;

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const { hosts, totalCount, activeCount, inactiveCount, hasNext } = await hostService.getAllHosts({
      pageNumber,
      pageSize,
      search,
      status,
      assignedEmployeeId,
      startDate,
      endDate,
    });

    const apiResponse = new ApiResponse<{ hosts: any[]; totalCount: number; activeCount: number; inactiveCount: number; hasNext: boolean }>();
    apiResponse.message = 'Hosts retrieved successfully!';
    apiResponse.data = { hosts, totalCount, activeCount, inactiveCount, hasNext };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getHostsByEmployeeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
    const search = req.query.search as string;
    const status = req.query.status as 'Active' | 'Inactive' | undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await hostService.getHostsByEmployee({
      employeeId,
      pageNumber,
      pageSize,
      search,
      status,
      startDate,
      endDate,
    });

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Hosts fetched successfully';
    apiResponse.statusCode = 200;
    apiResponse.data = result;

    return res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
    return;
  }
};

export default {
  createHostProfileController,
  updateHostProfileController,
  getAllHostsController,
  deleteHostController,
  getHostDetailsController,
  getHostPhotosController,
  getHostMachingController,
  getHostSentLikesController,
  sendLikeController,
  getUsersForHostController,
  getAssignedHosts,
  getHostRecentChats,
  getHostRecentChatsListController,
  markHostConversationReadController,
  getRecentChats,
  getUsersForHostControllerForEmployee,
  sendLikeControllerByEmployee,
  getAllHostsControllerByEmployee,
  getHostsByEmployeeController,
};
