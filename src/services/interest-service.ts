import InterestEntity from '../entities/interest-entity';
import ERROR from '../middlewares/web_server/http-error';
import { IIntrest } from '../models/interests/interest-model';
import { interestRepository } from '../repositories';
import { validateDocumentExists, validateNotFound, validateRequiredField, validateUserAuthorization } from '../utils/validators';
import { Types } from 'mongoose';

/**
 * Create a new user interest
 * @param {string} interest
 * @param {string} adminId
 * @returns {Promise<IIntrest>}
 */
const createUserInterest = async (interest: string, adminId: string): Promise<IIntrest> => {
  validateUserAuthorization(adminId);
  validateRequiredField(interest, 'interest');

  const existingInterest = await interestRepository.getByName(interest);
  validateDocumentExists(existingInterest, 'Interest already exists.');

  const createdUserId = Types.ObjectId.isValid(adminId) ? new Types.ObjectId(adminId) : null;

  const interestEntity = new InterestEntity(true, interest, createdUserId, new Date(), null, null);

  return await interestRepository.create(interestEntity);
};

/**
 * Get all interests with pagination
 * @param {Object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<{ interests: IIntrest[], totalCount: number, hasNext: boolean }> }
 */
const getInterests = async ({
  pageNumber,
  pageSize,
}: {
  pageNumber: number;
  pageSize: number;
}): Promise<{ interests: IIntrest[]; totalCount: number; hasNext: boolean }> => {
  const { interests, totalCount, hasNext } = await interestRepository.getAll({
    pageNumber,
    pageSize,
  });

  return { interests, totalCount, hasNext };
};

const editUserInterest = async (interestId: string, interest: string, adminId: string): Promise<IIntrest> => {
  validateUserAuthorization(adminId);
  validateRequiredField(interestId, 'Interest ID');
  validateRequiredField(interest, 'Interest');

  const existingInterest = await interestRepository.getById(interestId);
  validateNotFound(existingInterest, 'Interest not found');

  const duplicate = await interestRepository.getByName(interest);

  if (duplicate && duplicate._id.toString() !== interestId) {
    throw new ERROR.BadRequestError('Interest with this name already exists.');
  }

  existingInterest.interest = interest;
  existingInterest.updatedUser = new Types.ObjectId(adminId);
  existingInterest.updatedAt = new Date();

  return await interestRepository.update(existingInterest);
};

const deleteUserInterest = async (interestId: string, adminId: string): Promise<IIntrest> => {
  validateUserAuthorization(adminId);
  validateRequiredField(interestId, 'Interest ID is required');

  const existingInterest = await interestRepository.getById(interestId);
  validateNotFound(existingInterest, 'Interest');

  existingInterest!.documentStatus = false;
  existingInterest!.updatedUser = new Types.ObjectId(adminId);
  existingInterest!.updatedAt = new Date();

  await existingInterest!.save();

  return existingInterest!;
};

export default { getInterests, createUserInterest, editUserInterest, deleteUserInterest };
