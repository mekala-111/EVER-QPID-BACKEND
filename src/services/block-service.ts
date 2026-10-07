import BlockEntity from '../entities/block-entity';
import BLOCK from '../models/block/block';
import { IBlock } from '../models/block/block-model';
import { blockRepository } from '../repositories';
import { validateUserAuthorization, validateRequiredField } from '../utils/validators';

/**
 * Block a user
 * @param {string} userId
 * @param {string} blockedAccountId
 * @param {string[]} selectedReasons
 * @returns {Promise<IBlock>}
 */
const blockUser = async (userId: string, blockedAccountId: string, selectedReasons: string[]): Promise<IBlock> => {
  validateUserAuthorization(userId);
  validateRequiredField(blockedAccountId, 'blockedAccountId');

  const existingBlock = await blockRepository.findBlock(userId, blockedAccountId);
  if (existingBlock) {
    throw new Error('This user is already blocked.');
  }

  const dateBlocked = new Date();
  const blockEntity = new BlockEntity(true, blockedAccountId, userId, dateBlocked, selectedReasons, userId, new Date(), null, new Date());

  return await blockRepository.saveBlock(blockEntity);
};

/**
 * Find block
 * @param {string} blockedBy
 * @param {string} blockedAccountId
 * @returns {Promise<IBlock | null>}
 */
const findBlock = async (blockedBy: string, blockedAccountId: string): Promise<IBlock | null> => {
  return await blockRepository.findBlock(blockedBy, blockedAccountId);
};

/**
 * Unblock a user
 * @param {string} userId
 * @param {string} blockedAccountId
 * @returns {Promise<boolean>}
 */
const unblockUser = async (userId: string, blockedAccountId: string): Promise<boolean> => {
  validateUserAuthorization(userId);
  validateRequiredField(blockedAccountId, 'blockedAccountId');

  return await blockRepository.removeBlock(userId, blockedAccountId);
};

/**
 * Get all blocked users with pagination and optional filters
 * @param {string} userId
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @returns {Promise<{ blockedUsers: IBlock[], hasNext: boolean, totalCount: number }>}
 */

interface GetAllBlockedUsersOptions {
  pageNumber: number;
  pageSize: number;
  searchTag: string;
}

const getAllBlockedUsers = async (
  userId: string,
  { pageNumber, pageSize, searchTag }: GetAllBlockedUsersOptions,
): Promise<{ blockedUsers: IBlock[]; hasNext: boolean; totalCount: number }> => {
  validateUserAuthorization(userId);

  const { blockedUsers, totalCount, hasNext } = await blockRepository.getAllBlockedUsers({
    userId,
    pageNumber,
    pageSize,
    searchTag,
  });

  const populatedBlockedUsers = await BLOCK.populate(blockedUsers, {
    path: 'blockedAccount',
    select: 'fullName profileImageUrl',
  });

  const blockedUsersWithPopulatedAccount = populatedBlockedUsers as unknown as IBlock[];

  return { blockedUsers: blockedUsersWithPopulatedAccount, hasNext, totalCount };
};

/**
 * Block a user by admin
 * @param {string} adminId - The ID of the admin blocking the user.
 * @param {string} blockedAccountId - The ID of the account being blocked.
 * @param {string[]} selectedReasons - Reasons for blocking the account.
 * @returns {Promise<BlockEntity>}
 */
const blockUserAdmin = async (adminId: string, blockedAccountId: string, selectedReasons: string[]): Promise<BlockEntity> => {
  validateUserAuthorization(adminId);
  const existingBlock = await blockRepository.findAdminBlockedMe(blockedAccountId);
  if (existingBlock) {
    throw new Error('This user is already blocked by admin.');
  }

  const dateBlocked = new Date();
  const blockEntity = new BlockEntity(true, blockedAccountId, adminId, dateBlocked, selectedReasons, adminId, dateBlocked, null, null);
  const result: any = await blockRepository.saveBlockAdmin(blockEntity);
  return result;
};

/**
 * Unblock a user by admin
 * @param {string} adminId
 * @param {string} blockedAccountId
 * @returns {Promise<boolean>}
 */
const unblockUserAdmin = async (adminId: string, blockedAccountId: string): Promise<boolean> => {
  return await blockRepository.removeBlockAdmin(adminId, blockedAccountId);
};

/**
 * Find admin block
 * @param {string} blockedAccountId
 * @returns {Promise<IAdminBlock | null>}
 */
const findAdminBlock = async (blockedAccountId: string): Promise<IBlock | null> => {
  return await blockRepository.findAdminBlockedMe(blockedAccountId);
};

/**
 * Get all blocked users with pagination and optional filters
 * @param {string} adminId
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @returns {Promise<{ blockedUsers: IBlock[], hasNext: boolean, totalCount: number }>}
 */
const getAllBlockedAdmin = async (
  adminId: string,
  { pageNumber, pageSize, searchTag }: { pageNumber: number; pageSize: number; searchTag: string },
): Promise<{ blockedUsers: IBlock[]; hasNext: boolean; totalCount: number }> => {
  validateUserAuthorization(adminId);

  const { blockedUsers, totalCount, hasNext } = await blockRepository.getAllBlockedAdmin({
    adminId,
    pageNumber,
    pageSize,
    searchTag,
  });

  return { blockedUsers, hasNext, totalCount };
};

export default {
  blockUser,
  unblockUser,
  getAllBlockedUsers,
  findBlock,
  blockUserAdmin,
  unblockUserAdmin,
  findAdminBlock,
  getAllBlockedAdmin,
};
