import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import employeeService from '../services/employee-service';
import { IEmployee } from '../models/employee/employee-model';
import EMPLOYEE from '../models/employee/employee';
import ERROR from '../middlewares/web_server/http-error';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

const getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pageNumber: number = parseInt(req.query.pageNumber as string) || 1;
    const pageSize: number = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as 'Active' | 'Inactive' | undefined;

    const { employees, totalCount, hasNext } = await employeeService.getEmployees({ pageNumber, pageSize, search, role, status });

    const apiResponse = new ApiResponse<{ employees: IEmployee[]; totalCount: number; hasNext: boolean }>();
    apiResponse.message = 'Employees retrieved successfully!';
    apiResponse.data = { employees, totalCount, hasNext };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Create a new employee
 */
const createEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { name, email, role, authorityLevel } = req.body;

    const newEmployee = await employeeService.createEmployee({ name, email, role, authorityLevel }, adminId);

    const apiResponse = new ApiResponse<{ employee: IEmployee }>();
    apiResponse.message = 'Employee created successfully!';
    apiResponse.data = { employee: newEmployee };
    apiResponse.statusCode = 201;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Edit an employee
 */
const editEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { employeeId } = req.params;
    const { name, email, role, authorityLevel } = req.body;

    const updatedEmployee = await employeeService.editEmployee(employeeId, { name, email, role, authorityLevel }, adminId);

    const apiResponse = new ApiResponse<{ employee: IEmployee }>();
    apiResponse.message = 'Employee updated successfully!';
    apiResponse.data = { employee: updatedEmployee };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

/**
 * Delete an employee
 */
const deleteEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { employeeId } = req.params;

    const deletedEmployee = await employeeService.deleteEmployee(employeeId, adminId);

    const apiResponse = new ApiResponse<{ employee: IEmployee }>();
    apiResponse.message = 'Employee deleted successfully!';
    apiResponse.data = { employee: deletedEmployee };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getChatSupportEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employees: IEmployee[] = await employeeService.fetchChatSupportEmployees();

    const apiResponse = new ApiResponse<{ employees: IEmployee[] }>();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Chat Support Employees fetched successfully!';
    apiResponse.data = { employees };

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getAssignedHosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string | undefined;

    const result = await employeeService.getAssignedHosts({
      employeeId,
      pageNumber,
      pageSize,
      search,
    });

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Assigned hosts fetched successfully!';
    apiResponse.statusCode = 200;
    apiResponse.data = result;

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getAllHostLocations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const locations = await employeeService.fetchAllHostLocations();
    res.status(200).json({
      status: true,
      message: 'Host locations fetched successfully',
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

const getUniqueHostLocations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const locations = await employeeService.fetchUniqueHostLocations();
    res.status(200).json({
      status: true,
      message: 'Unique host locations fetched successfully',
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

const getUniqueHostLanguages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const languages = await employeeService.fetchUniqueHostLanguages();
    res.status(200).json({
      status: true,
      message: 'Unique host languages fetched successfully',
      data: languages,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user!.id;
    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    await EMPLOYEE.findByIdAndUpdate(employeeId, {
      isLoggedIn: false,
      lastLogoutAt: new Date(),
    });

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Logout successful';
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (e) {
    next(e);
  }
};

const getUniqueHostLocationsByEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user!.id;
    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    const locations = await employeeService.fetchUniqueHostLocationsByEmployee();
    res.status(200).json({
      status: true,
      message: 'Unique host locations fetched successfully',
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

const fetchHostUserChatsEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user!.id;
    if (!employeeId) {
      throw new Error('Employee not authenticated');
    }

    const { hostId, userId } = req.params;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const chats = await employeeService.getHostUserChatsEmployee({ hostId, userId, pageNumber, pageSize });

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
  getEmployees,
  createEmployee,
  editEmployee,
  deleteEmployee,
  getChatSupportEmployees,
  getAssignedHosts,
  getAllHostLocations,
  getUniqueHostLocations,
  getUniqueHostLanguages,
  logout,
  getUniqueHostLocationsByEmployee,
  fetchHostUserChatsEmployee,
};
