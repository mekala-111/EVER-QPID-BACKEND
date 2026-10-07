import { Types } from 'mongoose';
import FavoriteEntity from '../entities/favourite-entity';
import { IFavourite } from '../models/favourite/favourite-model';
import favouriteRepository from '../repositories/favourite-repository';
import { validateNotFound, validateRequiredField, validateUserAuthorization } from '../utils/validators';
import ERROR from '../middlewares/web_server/http-error';

/**
 * Get all favorites (for users or admin)
 * @param {string} userId
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<{ favorites: IFavorite[]; totalCount: number; hasNext: boolean }>}
 */
const getAllFavorites = async (
  userId: string,
  { pageNumber, pageSize }: { pageNumber: number; pageSize: number },
): Promise<{ favorites: IFavourite[]; totalCount: number; hasNext: boolean }> => {
  validateUserAuthorization(userId);

  const { favorites, totalCount, hasNext } = await favouriteRepository.getAll(userId, {
    pageNumber,
    pageSize,
  });

  return { favorites, totalCount, hasNext };
};

/**
 * Create a new favorite
 * @param {string} userId - ID of the user creating the favorite
 * @param {string} favProfileId - ID of the profile to be added as favorite
 * @returns {Promise<IFavourite>}
 */
const createFavorite = async (userId: string, favProfileId: string): Promise<IFavourite> => {
  validateUserAuthorization(userId);
  validateRequiredField(favProfileId, 'favProfileId');
  const existingFavorite = await favouriteRepository.findFavorateProfile(userId, favProfileId);
  if (existingFavorite) {
    throw new ERROR.DocumentExistsError('This profile already added to favorate');
  }
  // Convert string to ObjectId
  const favoriteProfileObjectId = new Types.ObjectId(favProfileId);
  const userIdObject = new Types.ObjectId(userId);
  const favoriteEntity: FavoriteEntity = new FavoriteEntity(
    true,
    userIdObject,
    favoriteProfileObjectId,
    userId,
    new Date(),
    userId,
    new Date(),
    false,
    null,
  );
  const newFavorite = await favouriteRepository.create(favoriteEntity);
  return newFavorite;
};

/**
 * Delete a favorite
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteFavorite = async (id: string): Promise<void> => {
  const existingFavorite = await favouriteRepository.getById(id);
  validateNotFound(existingFavorite, 'existingFavorite');

  await favouriteRepository.deleteById(id);
};

/**
 * Pin a favorate profile
 * @param {string} userId
 * @param {string} pinedProfile
 * @returns {Promise<IFavourite | null>}
 */
const pinProfile = async (userId: string, id: string): Promise<IFavourite | null> => {
  validateUserAuthorization(userId);
  const existingFavorite = await favouriteRepository.getById(id);
  if (!existingFavorite) {
    throw new ERROR.NotFoundError('This profile is not added to favorate');
  }

  const updateData: any = {
    isPined: !existingFavorite?.isPined,
    pinedOn: !existingFavorite?.isPined ? new Date() : null,
  };
  const updatedProfile = await favouriteRepository.update(id, updateData);
  return updatedProfile;
};

/**
 * Find favorite
 * @param {string} blockedBy
 * @param {string} blockedAccountId
 * @returns {Promise<IBlock | null>}
 */
const findFavorite = async (userId: string, favProfileId: string): Promise<IFavourite | null> => {
  return await favouriteRepository.findFavorateProfile(userId, favProfileId);
};

export default {
  getAllFavorites,
  createFavorite,
  deleteFavorite,
  pinProfile,
  findFavorite,
};
