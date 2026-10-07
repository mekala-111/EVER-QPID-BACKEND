import USER from '../models/user/user';

const addToken = async (userId: string, token: string): Promise<string[]> => {
  const user = await USER.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.fcmTokens.includes(token)) {
    user.fcmTokens.push(token);
    await user.save();
  }

  return user.fcmTokens;
};

const removeToken = async (userId: string, token: string): Promise<string[]> => {
  const user = await USER.findById(userId);
  if (!user) throw new Error('User not found');

  user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
  await user.save();

  return user.fcmTokens;
};

export default { addToken, removeToken };
