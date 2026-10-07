import { Types } from 'mongoose';
import FavoriteEntity from '../entities/favourite-entity';
import FAVORITES from '../models/favourite/favourite';
import { IFavourite } from '../models/favourite/favourite-model';

/**
 * Fetch a favorite by ID
 * @param {string} id
 * @returns {Promise<IFavorite | null>}
 */
const getById = async (id: string): Promise<IFavourite | null> => {
  return await FAVORITES.findById(id).exec();
};

/**
 * Create a new favorite
 * @param {FavoriteEntity} favoriteData
 * @returns {Promise<IFavorite>}
 */
const create = async (favoriteData: FavoriteEntity): Promise<IFavourite> => {
  const newFavorite = new FAVORITES(favoriteData);
  return await newFavorite.save();
};

/**
 * Delete a favorite by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteById = async (id: string): Promise<void> => {
  await FAVORITES.findByIdAndDelete(id).exec();
};

/**
 * Get all favorites with pagination and optional filters
 * @param {object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<{ favorites: IFavorite[], totalCount: number, hasNext: boolean }>}
 */
const getAll = async (
  userId: string,
  {
    pageNumber,
    pageSize,
  }: {
    pageNumber: number;
    pageSize: number;
  },
): Promise<{ favorites: IFavourite[]; totalCount: number; hasNext: boolean }> => {
  const userObjectId = new Types.ObjectId(userId);
  const skip = (pageNumber - 1) * pageSize;
  const favorites = (await FAVORITES.find({ userId: userObjectId })
    .sort({
      isPinned: -1,
      pinedOn: -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(pageSize)
    .populate('favProfileId', 'userName name profileImageUrl languages city state')
    .exec()) as IFavourite[];
  const totalCount = await FAVORITES.countDocuments({ userId: userObjectId });
  const hasNext = totalCount > pageNumber * pageSize;
  return { favorites, totalCount, hasNext };
};
/**
 * Update a favorate profile by ID
 * @param {string} userId
 * @param {Partial<IUser>} updateData
 * @returns {Promise<IUser | null>}
 */
const update = async (id: string, updateData: Partial<IFavourite>): Promise<IFavourite | null> => {
  return await FAVORITES.findByIdAndUpdate(id, updateData, { new: true }).exec();
};

/**
 * Find a favorate profile
 * @param {string} userId
 * @param {string} favProfileId
 * @returns {Promise<IBlock | null>}
 */
const findFavorateProfile = async (userId: string, favProfileId: string): Promise<IFavourite | null> => {
  return await FAVORITES.findOne({ userId: userId, favProfileId: favProfileId }).exec();
};
export default {
  getById,
  create,
  update,
  deleteById,
  getAll,
  findFavorateProfile,
};
