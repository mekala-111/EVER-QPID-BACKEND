import { IBlock } from '../models/block/block-model';
import { paginate } from '../helper/paginationHelper';
import BLOCK from '../models/block/block';
import BlockEntity from '../entities/block-entity';
import { Types } from 'mongoose';

/**
 * Save a new block record
 * @param {BlockEntity} blockEntity
 * @returns {Promise<IBlock>}
 */
const saveBlock = async (blockEntity: BlockEntity): Promise<IBlock> => {
  const newBlock = new BLOCK(blockEntity);
  return await newBlock.save();
};

/**
 * Remove a block record
 * @param {string} userId
 * @param {string} blockedAccountId
 * @returns {Promise<boolean>}
 */
const removeBlock = async (userId: string, blockedAccountId: string): Promise<boolean> => {
  const result = await BLOCK.deleteOne({ blockedBy: userId, blockedAccount: blockedAccountId });
  return result.deletedCount > 0;
};

/**
 * Get all blocked users with pagination and optional filters
 * @param {object} options
 * @param {string} userId
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @returns {Promise<{ blockedUsers: IBlock[], totalCount: number, hasNext: boolean }> }
 */

interface IBlockPopulated extends Omit<IBlock, 'blockedAccount'> {
  blockedAccount: {
    _id: Types.ObjectId;
    fullName: string;
    profileImageUrl?: string;
  };
}

const getAllBlockedUsers = async ({
  userId,
  pageNumber,
  pageSize,
  //searchTag,
}: {
  userId: string;
  pageNumber: number;
  pageSize: number;
  searchTag: string;
}): Promise<{ blockedUsers: IBlockPopulated[]; totalCount: number; hasNext: boolean }> => {
  const userIdObject = new Types.ObjectId(userId);
  const filters = {
    createdUser: userIdObject,
  };
  const { data: blockedUsers, totalCount, hasNext } = await paginate(BLOCK, { pageNumber, pageSize }, filters);

  const populated = await BLOCK.populate(blockedUsers, {
    path: 'blockedAccount',
    select: 'fullName profileImageUrl',
  });

  const blockedUsersWithPopulatedAccount = populated as unknown as IBlockPopulated[];

  return { blockedUsers: blockedUsersWithPopulatedAccount, totalCount, hasNext };
};

/**
 * Find an existing block record
 * @param {string} userId - The user who might have blocked another account
 * @param {string} blockedAccountId - The account that might already be blocked
 * @returns {Promise<IBlock | null>} - Returns the block record if found
 */
const findBlock = async (userId: string, blockedAccountId: string): Promise<IBlock | null> => {
  return await BLOCK.findOne({ blockedBy: userId, blockedAccount: blockedAccountId }).exec();
};

/**
 * Find an existing block record
 * @param {string} userId - The user who might have blocked another account
 * @returns {Promise<IBlock | null>} - Returns the block record if found
 */
const findUserBlockedByHost = async (userId: string): Promise<any> => {
  return await BLOCK.find({ blockedAccount: userId }).select('blockedBy').lean();
};

/**
 * Save a new block record by admin
 * @param {BlockEntity} blockEntity
 * @returns {Promise<IBlock>}
 */
const saveBlockAdmin = async (blockEntity: BlockEntity): Promise<IBlock> => {
  const newBlock = new BLOCK(blockEntity);
  return await newBlock.save();
};

/**
 * Remove a block record by admin
 * @param {string} userId
 * @param {string} blockedAccountId
 * @returns {Promise<boolean>}
 */
const removeBlockAdmin = async (userId: string, blockedAccountId: string): Promise<boolean> => {
  const result = await BLOCK.deleteOne({ blockedBy: userId, blockedAccount: blockedAccountId });
  return result.deletedCount > 0;
};

const findAdminBlockedMe = async (userId: string): Promise<IBlock | null> => {
  const userData = await BLOCK.findOne({ blockedAccount: userId }).select('blockedBy').exec();

  return userData;
};

/**
 * Get all blocked users with pagination and optional filters
 * @param {object} options
 * @param {string} adminId
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {string} options.searchTag
 * @returns {Promise<{ blockedUsers: IBlock[], totalCount: number, hasNext: boolean }> }
 */
const getAllBlockedAdmin = async ({
  adminId,
  pageNumber,
  pageSize,
  //searchTag,
}: {
  adminId: string;
  pageNumber: number;
  pageSize: number;
  searchTag: string;
}): Promise<{ blockedUsers: IBlock[]; totalCount: number; hasNext: boolean }> => {
  const adminIdObject = new Types.ObjectId(adminId);
  const filters = {
    createdUser: adminIdObject,
  };

  const { data: blockedUsers, totalCount, hasNext } = await paginate(BLOCK, { pageNumber, pageSize }, filters);
  return { blockedUsers, totalCount, hasNext };
};
const getUsersWhoBlockedMe = async (userId: string): Promise<any> => {
  const userData = await BLOCK.find({ blockedAccount: userId }).select('blockedBy').exec();

  return userData;
};

/**
 * Find an existing block record
 * @param {string} userId - The user who might have blocked another account
 * @returns {Promise<IBlock | null>} - Returns the block record if found
 */
const getUsersBlockedByMe = async (userId: string): Promise<any> => {
  const userData = await BLOCK.find({ blockedBy: userId }).select('blockedAccount').exec();

  return userData;
};

export default {
  saveBlock,
  removeBlock,
  getAllBlockedUsers,
  findBlock,
  findUserBlockedByHost,
  saveBlockAdmin,
  removeBlockAdmin,
  findAdminBlockedMe,
  getAllBlockedAdmin,
  getUsersBlockedByMe,
  getUsersWhoBlockedMe,
};
