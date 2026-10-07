import { Types } from 'mongoose';

/**
 * Validate a MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @throws {Error} If the ID is invalid
 */
export const validateObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
};
