import EMPLOYEE from '../models/employee/employee';
import { IEmployee } from '../models/employee/employee-model';
import { EmployeeEntity } from '../entities/employee-entity';
import { paginate } from '../helper/paginationHelper';
import { Types } from 'mongoose';
import USER from '../models/user/user';
import { IUser } from '../models/user/user-model';
import CHATSMESSAGES from '../models/chatMessage/chatMessage';

const create = async (employeeData: EmployeeEntity): Promise<IEmployee> => {
  const newEmployee = new EMPLOYEE(employeeData);
  return await newEmployee.save();
};

const findAll = async ({
  pageNumber,
  pageSize,
  search,
  role,
  status,
}: {
  pageNumber: number;
  pageSize: number;
  search?: string;
  role?: string;
  status?: 'Active' | 'Inactive';
}): Promise<{ employee: IEmployee[]; totalCount: number; hasNext: boolean }> => {
  const filter: any = {};

  if (search) {
    filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }

  if (role) filter.role = { $regex: `^${role}$`, $options: 'i' };

  if (status === 'Active') filter.isLoggedIn = true;
  if (status === 'Inactive') filter.isLoggedIn = false;

  const { data, totalCount, hasNext } = await paginate(EMPLOYEE, { pageNumber, pageSize }, filter);

  const employeeWithStatus = data.map((emp: IEmployee) => ({
    ...emp,
    status: emp.isLoggedIn ? 'Active' : 'Inactive',
  }));

  return { employee: employeeWithStatus, totalCount, hasNext };
};

const findById = async (employeeId: string): Promise<IEmployee | null> => {
  return await EMPLOYEE.findById(employeeId).exec();
};

const getByEmail = async (email: string): Promise<IEmployee | null> => {
  return await EMPLOYEE.findOne({ email }).exec();
};

const update = async (employeeData: IEmployee): Promise<IEmployee> => {
  return await employeeData.save();
};

const deleteById = async (employeeId: string): Promise<void> => {
  await EMPLOYEE.findByIdAndDelete(employeeId).exec();
};

const updateOtp = async (email: string, otp: string, expiry: Date) => {
  return await EMPLOYEE.findOneAndUpdate({ email, documentStatus: true }, { otp, otpExpiry: expiry }, { new: true });
};

const resetPassword = async (email: string, hashedPassword: string) => {
  return await EMPLOYEE.findOneAndUpdate({ email, documentStatus: true }, { password: hashedPassword, otp: null, otpExpiry: null }, { new: true });
};

const getAssignedHosts = async (employeeId: string) => {
  const employeeObjectId = new Types.ObjectId(employeeId);
  return USER.find({
    assignedEmployee: employeeObjectId,
    userType: 'host',
    documentStatus: true,
  }).select('-password -otp -otpExpiry');
};

const findChatSupportEmployees = async (): Promise<IEmployee[]> => {
  return EMPLOYEE.find({ role: 'Chat Support', documentStatus: true }).lean();
};

const findHostsByEmployeeId = async (employeeId: string): Promise<IUser[]> => {
  return USER.find({ assignedEmployee: employeeId, documentStatus: true }).lean();
};

const getChatSupportEmployees = async () => {
  return EMPLOYEE.find({ role: 'Chat Support', documentStatus: true });
};

const getAssignedHostsAdmin = async ({
  employeeId,
  pageNumber,
  pageSize,
  search,
}: {
  employeeId: string;
  pageNumber: number;
  pageSize: number;
  search?: string;
}): Promise<{ hosts: IUser[]; totalCount: number; hasNext: boolean }> => {
  if (!Types.ObjectId.isValid(employeeId)) {
    throw new Error('Invalid employeeId');
  }

  const filter: any = {
    assignedEmployee: new Types.ObjectId(employeeId),
    userType: 'host',
    documentStatus: true,
  };

  if (search) {
    filter.fullName = { $regex: search, $options: 'i' };
  }

  const totalCount = await USER.countDocuments(filter);

  const hosts = await USER.find(filter)
    .select('fullName email profileImageUrl isOnline gender')
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return {
    hosts,
    totalCount,
    hasNext: pageNumber * pageSize < totalCount,
  };
};

const getAllHostLocations = async (): Promise<{ locationString: string }[]> => {
  return USER.find(
    {
      isHostProfile: true,
      documentStatus: true,
      locationString: { $exists: true, $ne: '' },
    },
    {
      locationString: 1,
      _id: 0,
    },
  );
};

const getUniqueHostLocations = async (): Promise<string[]> => {
  return USER.distinct('locationString', {
    isHostProfile: true,
    documentStatus: true,
  });
};

const getUniqueHostLanguages = async (): Promise<string[]> => {
  return USER.distinct('otherLanguages', {
    isHostProfile: true,
    documentStatus: true,
  });
};

interface FetchChatsRepoOptions {
  hostId: string;
  userId: string;
  skip?: number;
  limit?: number;
}

const fetchHostUserChatsRepoEmployee = async ({ hostId, userId, skip = 0, limit = 20 }: FetchChatsRepoOptions) => {
  return CHATSMESSAGES.find({
    $or: [
      { senderId: hostId, receiverId: userId },
      { senderId: userId, receiverId: hostId },
    ],
    documentStatus: true,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default {
  create,
  findAll,
  findById,
  getByEmail,
  update,
  deleteById,
  updateOtp,
  resetPassword,
  getAssignedHosts,
  findChatSupportEmployees,
  findHostsByEmployeeId,
  getChatSupportEmployees,
  getAssignedHostsAdmin,
  getAllHostLocations,
  getUniqueHostLocations,
  getUniqueHostLanguages,
  fetchHostUserChatsRepoEmployee,
};
