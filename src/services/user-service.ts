import { Types } from 'mongoose';
import { userRepository } from '../repositories';

const getUserWithPreferences = async (userId: string) => {
  const id = new Types.ObjectId(userId);

  const user = await userRepository.findUserById(id);
  if (!user) throw new Error('User not found');

  const preferences = await userRepository.findUserPreferences(id);

  return {
    ...user.toObject(),
    preferences: preferences || {},
  };
};

export default { getUserWithPreferences };
