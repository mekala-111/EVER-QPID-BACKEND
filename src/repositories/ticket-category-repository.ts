import { ITicketCategory } from '../models/ticket-category/ticket-category-model';
import TICKET_CATEGORY from '../models/ticket-category/ticket-category';
import TicketCategoryEntity from '../entities/ticket-category-enitity';

/**
 * Add new ticket category to the database
 * @param {TicketCategoryEntity} ticketCategoryEntity
 * @returns {Promise<ITicketCategory>}
 */
const createTicketCategory = async (ticketCategoryEntity: TicketCategoryEntity): Promise<ITicketCategory> => {
  const ticketCategory = await new TICKET_CATEGORY(ticketCategoryEntity).save();
  return ticketCategory;
};

/**
 * Check if ticket category exists
 * @param {string} categoryName
 * @param {string} id
 * @returns {Promise<ITicketCategory | null>}
 */
const isExists = async (categoryName: string, id: string): Promise<ITicketCategory | null> => {
  let categoryData: any;

  if (id) {
    categoryData = await TICKET_CATEGORY.findOne({ categoryName: { $regex: `^${categoryName}$`, $options: 'i' }, _id: { $ne: id } });
  } else {
    categoryData = await TICKET_CATEGORY.findOne({ categoryName: { $regex: `^${categoryName}$`, $options: 'i' } });
  }

  return categoryData;
};

/**
 * Update ticket category data
 * @param {TicketCategoryEntity} ticketCategoryEntity
 * @param {string} id
 * @returns {Promise<ITicketCategory | null>}
 */
const updateTicketCategory = async (ticketCategoryEntity: TicketCategoryEntity, id: string): Promise<ITicketCategory | null> => {
  const ticketCategory = await TICKET_CATEGORY.findByIdAndUpdate(id, ticketCategoryEntity, { new: true });
  return ticketCategory;
};

/**
 * Soft delete ticket category
 * @param {string} id
 * @param {object} update
 * @returns {Promise<ITicketCategory | null>}
 */
const deleteTicketCategory = async (id: string, update: object): Promise<ITicketCategory | null> => {
  const ticketCategory = await TICKET_CATEGORY.findByIdAndUpdate(id, update, { new: true });
  return ticketCategory;
};

/**
 * Get all ticket categories
 * @returns {Promise<ITicketCategory[]>}
 */
const getTicketCategories = async (): Promise<ITicketCategory[]> => {
  const categories = await TICKET_CATEGORY.find({ documentStatus: true });
  return categories;
};

/**
 * Get ticket category by ID
 * @param {string} id
 * @returns {Promise<ITicketCategory | null>}
 */
const getTicketCategoryById = async (id: string): Promise<ITicketCategory | null> => {
  const ticketCategory = await TICKET_CATEGORY.findById(id);
  return ticketCategory;
};

/**
 * Get all ticket categories for users
 * @returns {Promise<ITicketCategory[]>}
 */
const getAllTicketCategories = async (): Promise<ITicketCategory[]> => {
  return await TICKET_CATEGORY.find({ documentStatus: true });
};

/**
 * Get a single ticket category by ID for users
 * @param {string} id
 * @returns {Promise<ITicketCategory | null>}
 */
const getTicketCategoryByIdUser = async (id: string): Promise<ITicketCategory | null> => {
  return await TICKET_CATEGORY.findById(id);
};

export default {
  createTicketCategory,
  isExists,
  updateTicketCategory,
  deleteTicketCategory,
  getTicketCategories,
  getTicketCategoryById,
  getAllTicketCategories,
  getTicketCategoryByIdUser,
};
