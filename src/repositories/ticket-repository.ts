import { SupportEntity } from '../entities/support-entity';
import SUPPORT from '../models/support/support';
import { ISupport } from '../models/support/support-model';
import { Types } from 'mongoose';

const getAllTickets = async (
  pagination: { pageNumber: number; pageSize: number },
  filters: { search: string; status: string; priority: string },
): Promise<{
  tickets: SupportEntity[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}> => {
  const { pageNumber, pageSize } = pagination;
  const { search, status, priority } = filters;

  const query: any = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (status !== 'all') query.status = status;
  if (priority !== 'all') query.priority = priority;

  const totalCount = await SUPPORT.countDocuments(query);

  const docs = await SUPPORT.find(query)
    .populate('userId', 'firstName email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean<ISupport[]>();

  const tickets = docs.map(
    (d) =>
      new SupportEntity(
        d.documentStatus,
        d.userId,
        d.email,
        d.firstName,
        d.category,
        d.subject,
        d.description,
        d.attachments ?? [],
        d.status as 'open' | 'closed',
        d.assignedTo ?? null,
        d.priority as 'low' | 'medium' | 'high',
        d.createdAt,
        d.updatedAt,
        (d._id as any).toString(),
      ),
  );

  const hasNext = pageNumber * pageSize < totalCount;

  return {
    tickets,
    totalCount,
    pageNumber,
    pageSize,
    hasNext,
  };
};

const assignTicketToEmployee = async (ticketId: string, employeeId: string) => {
  return SUPPORT.findByIdAndUpdate(ticketId, { assignedTo: employeeId, status: 'open' }, { new: true }).populate('assignedTo', 'name email');
};

const createTicket = async (ticketData: any) => {
  const newTicket = new SUPPORT({
    userId: ticketData.userId ?? null,
    email: ticketData.email,
    firstName: ticketData.firstName,
    category: ticketData.category,
    subject: ticketData.subject,
    description: ticketData.description,
    attachments: ticketData.attachments ?? [],
    status: 'open',
    assignedTo: null,
  });

  return await newTicket.save();
};

interface SideProfileDetails {
  fullName: string;
  joinedDate: Date | null;
  lastActive: Date | null;
  phoneNo: string;
  email: string;
  isVerified: boolean;
  isSubscribed: boolean;
  totalMatches: number;
  totalSpend: number;
  openTickets: number;
  lastChatOn: Date | null;
}

const getTicketById = async (ticketId: string): Promise<{ ticket: SupportEntity; sideProfileDetails: SideProfileDetails | null } | null> => {
  const doc = await SUPPORT.findById(ticketId)
    .populate('userId', 'fullName joinedDate lastActive phoneNo email isVerified isSubscribed totalMatches totalSpend openTickets lastChatOn')
    .populate('assignedTo', 'name email')
    .lean<
      {
        userId?: Partial<SideProfileDetails> & { _id: any };
        assignedTo?: { name: string; email: string; _id: any };
      } & ISupport
    >();

  if (!doc) return null;

  const ticket = new SupportEntity(
    doc.documentStatus,
    doc.userId?._id ?? null,
    doc.email,
    doc.firstName,
    doc.category,
    doc.subject,
    doc.description,
    doc.attachments ?? [],
    doc.status as 'open',
    doc.assignedTo ?? null,
    doc.priority as 'low' | 'medium' | 'high',
    doc.createdAt,
    doc.updatedAt,
    (doc._id as any).toString(),
  );

  const sideProfileDetails: SideProfileDetails | null = doc.userId
    ? {
        fullName: doc.userId.fullName || '',
        joinedDate: doc.userId.joinedDate || null,
        lastActive: doc.userId.lastActive || null,
        phoneNo: doc.userId.phoneNo || '',
        email: doc.userId.email || '',
        isVerified: doc.userId.isVerified ?? false,
        isSubscribed: doc.userId.isSubscribed ?? false,
        totalMatches: doc.userId.totalMatches ?? 0,
        totalSpend: doc.userId.totalSpend ?? 0,
        openTickets: doc.userId.openTickets ?? 0,
        lastChatOn: doc.userId.lastChatOn || null,
      }
    : null;

  return { ticket, sideProfileDetails };
};

const closeTicket = async (ticketId: string) => {
  return SUPPORT.findByIdAndUpdate(ticketId, { status: 'closed', updatedAt: new Date() }, { new: true }).populate('assignedTo', 'name email');
};

const findByUserId = async (userId: string): Promise<ISupport[]> => {
  return SUPPORT.find({
    userId: new Types.ObjectId(userId),
    documentStatus: true,
  })
    .select('subject category priority status createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

const cancelTicket = async (ticketId: string) => {
  return SUPPORT.findByIdAndUpdate(ticketId, { status: 'cancelled', updatedAt: new Date() }, { new: true }).populate('assignedTo', 'name email');
};

export default { getAllTickets, assignTicketToEmployee, createTicket, getTicketById, closeTicket, findByUserId, cancelTicket };
