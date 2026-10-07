import ERROR from '../middlewares/web_server/http-error';
import { ITicketCategory } from '../models/ticket-category/ticket-category-model';
import { ticketCategoryRepository } from '../repositories';

/**
 * Add Ticket Category
 * @param { string } adminId
 * @param { any } obj
 * @returns { Promise<ITicketCategory | null> }
 */
const addTicketCategory = async (adminId: string, obj: any): Promise<ITicketCategory | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('UnAuthorized');
  if (!obj.categoryName) throw new ERROR.InvalidInputError('Ticket category name is required');

  const isExists = await ticketCategoryRepository.isExists(obj.categoryName, '');
  if (isExists) throw new ERROR.DocumentExistsError('Ticket category already exists!');

  return await ticketCategoryRepository.createTicketCategory(obj);
};

/**
 * Update Ticket Category
 * @param { string } adminId
 * @param { any } obj
 * @param { string } ticketCategoryId
 * @returns { Promise<ITicketCategory | null> }
 */
const updateTicketCategory = async (adminId: string, obj: any, ticketCategoryId: string): Promise<ITicketCategory | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('UnAuthorized');
  if (!ticketCategoryId) throw new ERROR.InvalidInputError('Please select a ticket category');
  if (!obj.categoryName) throw new ERROR.InvalidInputError('Ticket category name is required');

  const isExists = await ticketCategoryRepository.isExists(obj.categoryName, ticketCategoryId);
  if (isExists) throw new ERROR.DocumentExistsError('Ticket category already exists!');

  return await ticketCategoryRepository.updateTicketCategory(obj, ticketCategoryId);
};

/**
 * Delete Ticket Category (Soft Delete)
 * @param { string } adminId
 * @param { string } id
 * @returns { Promise<any | null> }
 */
const deleteTicketCategory = async (adminId: string, ticketCategoryId: string): Promise<any | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('UnAuthorized');
  if (!ticketCategoryId) throw new ERROR.InvalidInputError('Please select a ticket category');

  const update = {
    documentStatus: false,
    updatedAt: new Date(),
  };

  return await ticketCategoryRepository.deleteTicketCategory(ticketCategoryId, update);
};

/**
 * Get all Ticket Categories
 * @param { string } adminId
 * @returns { Promise<ITicketCategory[]> }
 */
const getTicketCategories = async (adminId: string): Promise<ITicketCategory[]> => {
  if (!adminId) throw new ERROR.AuthorizationError('UnAuthorized');
  return await ticketCategoryRepository.getTicketCategories();
};

/**
 * Get Ticket Category by ID
 * @param { string } adminId
 * @param { string } id
 * @returns { Promise<ITicketCategory | null> }
 */
const getTicketCategoryById = async (adminId: string, id: string): Promise<ITicketCategory | null> => {
  if (!adminId) throw new ERROR.AuthorizationError('UnAuthorized');
  return await ticketCategoryRepository.getTicketCategoryById(id);
};

/**
 * Get all ticket categories for users
 * @returns { Promise<ITicketCategory[]> }
 */
const getTicketCategoriesForUsers = async (): Promise<ITicketCategory[]> => {
  return await ticketCategoryRepository.getAllTicketCategories();
};

/**
 * Get a single ticket category by ID for users
 * @param { string } id
 * @returns { Promise<ITicketCategory | null> }
 */
const getTicketCategoryByIdUser = async (id: string): Promise<ITicketCategory | null> => {
  return await ticketCategoryRepository.getTicketCategoryById(id);
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
