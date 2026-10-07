import { paginate } from '../helper/paginationHelper';
import INTEREST from '../models/interests/interest';
import InterestEntity from '../entities/interest-entity';
import { IIntrest } from '../models/interests/interest-model';

/**
 * Get interest by name
 * @param {string} interestName
 * @returns {Promise<IIntrest | null>}
 */
const getByName = async (interestName: string): Promise<IIntrest | null> => {
  return await INTEREST.findOne({ interest: interestName }).exec();
};

/**
 * Create a new interest
 * @param {InterestEntity} interestData
 * @returns {Promise<any>}
 */
const create = async (interestData: InterestEntity): Promise<IIntrest> => {
  const newInterest = new INTEREST(interestData);
  return await newInterest.save();
};

/**
 * Get all interests with pagination
 * @param {object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @returns {Promise<{ interests: IIntrest[], totalCount: number, hasNext: boolean }> }
 */
const getAll = async ({
  pageNumber,
  pageSize,
}: {
  pageNumber: number;
  pageSize: number;
}): Promise<{ interests: IIntrest[]; totalCount: number; hasNext: boolean }> => {
  const { data: interests, totalCount, hasNext } = await paginate(INTEREST, { pageNumber, pageSize });
  return { interests, totalCount, hasNext };
};

const getById = async (interestId: string): Promise<IIntrest | null> => {
  return await INTEREST.findById(interestId).exec();
};

const update = async (interestData: IIntrest): Promise<IIntrest> => {
  return await interestData.save();
};

export default { getByName, create, getAll, getById, update };
