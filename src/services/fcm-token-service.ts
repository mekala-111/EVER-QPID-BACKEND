import { userRepository } from '../repositories';
import fcmTokenRepository from '../repositories/fcmToken-repository';

const saveFCMToken = async (userId: string, fcmToken: string) => {
  await userRepository.addFCMToken(userId, fcmToken);
};

const registerToken = async (userId: string, token: string) => {
  return await fcmTokenRepository.addToken(userId, token);
};

const removeToken = async (userId: string, token: string) => {
  return await fcmTokenRepository.removeToken(userId, token);
};

export default {
  saveFCMToken,
  registerToken,
  removeToken,
};
