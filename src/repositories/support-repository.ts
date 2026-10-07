import SUPPORT from '../models/support/support';
import { ISupport } from '../models/support/support-model';
import { SupportEntity } from '../entities/support-entity';

const createSupport = async (supportEntity: SupportEntity): Promise<ISupport> => {
  const support = new SUPPORT(supportEntity);
  await support.save();
  return support;
};

const getSupports = async (): Promise<ISupport[]> => {
  const support = await SUPPORT.find({ documentStatus: true, status: 'open' });
  return support;
};

const getSupportById = async (id: string): Promise<ISupport | null> => {
  return await SUPPORT.findById(id).lean();
};

const updateSupportStatus = async (ticketId: string, status: 'open' | 'closed'): Promise<ISupport | null> => {
  const support = await SUPPORT.findByIdAndUpdate(ticketId, { status, updatedAt: new Date() }, { new: true });
  return support;
};

const addReply = async (id: string, reply: any) => {
  return await SUPPORT.findByIdAndUpdate(id, { $push: { replies: reply } }, { new: true });
};

export default {
  createSupport,
  getSupports,
  getSupportById,
  updateSupportStatus,
  addReply,
};
