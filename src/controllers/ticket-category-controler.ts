import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import { ITicketCategory } from '../models/ticket-category/ticket-category-model';
import { ticketCategoryService } from '../services';

/**
 * Create a ticket category
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const addTicketCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;
    const adminId = obj?.adminId;
    obj.createdUser = obj?.adminId;
    const ticketCategoryData: ITicketCategory | null = await ticketCategoryService.addTicketCategory(adminId, obj);
    const apiResponse: ApiResponse<{ ticketCategoryData: ITicketCategory | null }> = new ApiResponse<{
      ticketCategoryData: ITicketCategory | null;
    }>();
    apiResponse.message = 'Ticket Category Created Successfully';
    apiResponse.data = { ticketCategoryData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a ticket category
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const updateTicketCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;
    const adminId = obj?.adminId;
    obj.updatedUser = obj?.adminId;
    const { ticketCategoryId } = req.params;
    const ticketCategoryData: ITicketCategory | null = await ticketCategoryService.updateTicketCategory(adminId, obj, ticketCategoryId); // Pass ID to service
    const apiResponse: ApiResponse<{ ticketCategoryData: ITicketCategory | null }> = new ApiResponse<{
      ticketCategoryData: ITicketCategory | null;
    }>();
    apiResponse.message = 'Ticket Category Updated Successfully';
    apiResponse.data = { ticketCategoryData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a ticket category
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const deleteTicketCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketCategoryId } = req.params;
    const obj: any = req.body;
    const adminId = obj?.adminId;
    const ticketCategoryData: ITicketCategory | null = await ticketCategoryService.deleteTicketCategory(adminId, ticketCategoryId); // Pass only ID to service
    const apiResponse: ApiResponse<{ ticketCategoryData: ITicketCategory | null }> = new ApiResponse<{
      ticketCategoryData: ITicketCategory | null;
    }>();
    apiResponse.message = 'Ticket Category Deleted Successfully';
    apiResponse.data = { ticketCategoryData };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a list of ticket categories
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getTicketCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;
    const adminId = obj?.adminId;
    const ticketCategories: ITicketCategory[] = await ticketCategoryService.getTicketCategories(adminId); // Fetch all ticket categories from the service
    const apiResponse: ApiResponse<{ ticketCategories: ITicketCategory[] }> = new ApiResponse<{ ticketCategories: ITicketCategory[] }>();
    apiResponse.message = 'Ticket Categories fetched successfully';
    apiResponse.data = { ticketCategories };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single ticket category by ID
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getTicketCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const obj: any = req.body;
    const adminId = obj?.adminId;
    const ticketCategoryId = req.params.id;
    const ticketCategory: ITicketCategory | null = await ticketCategoryService.getTicketCategoryById(adminId, ticketCategoryId); // Fetch ticket category by ID
    const apiResponse: ApiResponse<{ ticketCategory: ITicketCategory | null }> = new ApiResponse<{ ticketCategory: ITicketCategory | null }>();
    apiResponse.message = 'Ticket Category fetched successfully';
    apiResponse.data = { ticketCategory };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all ticket categories for users
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getTicketCategoriesForUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketCategories: ITicketCategory[] = await ticketCategoryService.getTicketCategoriesForUsers();
    const apiResponse: ApiResponse<{ ticketCategories: ITicketCategory[] }> = new ApiResponse<{ ticketCategories: ITicketCategory[] }>();
    apiResponse.message = 'Ticket Categories fetched successfully';
    apiResponse.data = { ticketCategories };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single ticket category by ID for users
 * @param { Request } req
 * @param { Response } res
 * @param { NextFunction } next
 */
const getTicketCategoryByIdUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketCategoryId = req.params.id;
    const ticketCategory: ITicketCategory | null = await ticketCategoryService.getTicketCategoryByIdUser(ticketCategoryId);
    const apiResponse: ApiResponse<{ ticketCategory: ITicketCategory | null }> = new ApiResponse<{ ticketCategory: ITicketCategory | null }>();
    apiResponse.message = 'Ticket Category fetched successfully';
    apiResponse.data = { ticketCategory };
    apiResponse.statusCode = 200;
    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

export default {
  addTicketCategory,
  updateTicketCategory,
  deleteTicketCategory,
  getTicketCategories,
  getTicketCategoryById,
  getTicketCategoriesForUsers,
  getTicketCategoryByIdUser,
};
