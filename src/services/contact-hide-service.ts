import { userRepository } from '../repositories';
import ERROR from '../middlewares/web_server/http-error';
import mongoose from 'mongoose';
import USER from '../models/user/user';

const importContacts = async (userId: string, contacts: string[]) => {
  const user = await userRepository.findUserById(new mongoose.Types.ObjectId(userId));

  if (!user) throw new ERROR.NotFoundError('User not found');

  const uniqueContacts = [...new Set(contacts)];

  await userRepository.addHiddenContacts(userId, uniqueContacts);

  const existingHidden = user.hiddenContacts || [];

  const mergedContacts = Array.from(new Set([...existingHidden, ...contacts]));

  await userRepository.updateHiddenContacts(userId, mergedContacts);

  const otherUsers = await USER.find({ mobileNumber: { $in: uniqueContacts } });

  for (const other of otherUsers) {
    await userRepository.addHiddenContacts(other._id.toString(), [user.mobileNumber]);
  }

  return { hiddenContacts: uniqueContacts };
};

const removeHiddenContact = async (userId: string, contacts: string[]) => {
  const user = await userRepository.findUserById(new mongoose.Types.ObjectId(userId));

  if (!user) throw new ERROR.NotFoundError('User not found');

  const updated = user.hiddenContacts?.filter((n) => !contacts.includes(n)) || [];

  await userRepository.updateHiddenContacts(userId, updated);

  const otherUsers = await USER.find({ mobileNumber: { $in: contacts } });

  for (const other of otherUsers) {
    await userRepository.removeHiddenContact(other._id.toString(), user.mobileNumber);
  }

  return { getHiddenContacts: updated };
};

const getHiddenContacts = async (userId: string) => {
  const user = await userRepository.findUserById(new mongoose.Types.ObjectId(userId));

  if (!user) throw new ERROR.NotFoundError('User not found');

  return { hiddenContacts: user.hiddenContacts };
};

export default {
  importContacts,
  removeHiddenContact,
  getHiddenContacts,
};
