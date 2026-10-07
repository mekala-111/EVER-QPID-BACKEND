import { AdminEmailEntity } from '../entities/adminEMail-entity';
import adminEmailRepository from '../repositories/admin-email-repository';

const getEmail = async () => {
  return await adminEmailRepository.getAdminEmail();
};

const updateEmail = async (email: string) => {
  const adminEmail = new AdminEmailEntity(email);
  const updatedEmail = await adminEmailRepository.upsertAdminEmail(adminEmail.email);
  return updatedEmail;
};

export default { getEmail, updateEmail };
