import ADMINEMAIL from '../models/admin-email/admin-email';
import { IAdminEmail } from '../models/admin-email/admin-email-model';

const getAdminEmail = async (): Promise<IAdminEmail | null> => {
  return await ADMINEMAIL.findOne({});
};

const upsertAdminEmail = async (email: string): Promise<IAdminEmail> => {
  return await ADMINEMAIL.findOneAndUpdate({}, { email }, { new: true, upsert: true, runValidators: true });
};

export default { getAdminEmail, upsertAdminEmail };
