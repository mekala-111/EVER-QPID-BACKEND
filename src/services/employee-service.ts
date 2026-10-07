import { EmployeeEntity } from '../entities/employee-entity';
import ERROR from '../middlewares/web_server/http-error';
import { IEmployee } from '../models/employee/employee-model';
import { IUser } from '../models/user/user-model';
import employeeRepository from '../repositories/employee-repository';
import { validateDocumentExists, validateNotFound, validateRequiredField, validateUserAuthorization } from '../utils/validators';
import { Types } from 'mongoose';

const createEmployee = async (data: any, adminId: string): Promise<IEmployee> => {
  validateUserAuthorization(adminId);
  validateRequiredField(data.name, 'Employee Name');
  validateRequiredField(data.email, 'Employee Email');
  validateRequiredField(data.role, 'Employee Role');
  validateRequiredField(data.authorityLevel, 'Authority Level');

  const existing = await employeeRepository.getByEmail(data.email);
  validateDocumentExists(existing, 'Employee with this email already exists.');

  if (!Types.ObjectId.isValid(adminId)) {
    throw new Error('Invalid adminId');
  }

  const createdUserId = new Types.ObjectId(adminId);

  const employeeEntity = new EmployeeEntity(
    data.name,
    data.email,
    data.role,
    data.authorityLevel,
    null,
    null,
    null,
    createdUserId,
    new Date(),
    true,
    null,
    null,
  );

  return await employeeRepository.create(employeeEntity);
};

const getEmployees = async ({
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
}): Promise<{ employees: IEmployee[]; totalCount: number; hasNext: boolean }> => {
  const {
    employee: employees,
    totalCount,
    hasNext,
  } = await employeeRepository.findAll({
    pageNumber,
    pageSize,
    search,
    role,
    status,
  });

  return { employees, totalCount, hasNext };
};

const editEmployee = async (employeeId: string, data: any, adminId: string): Promise<IEmployee> => {
  validateUserAuthorization(adminId);
  validateRequiredField(employeeId, 'Employee ID');

  const employee = await employeeRepository.findById(employeeId);
  validateNotFound(employee, 'Employee not found');

  if (data.email && data.email !== employee.email) {
    const duplicate = await employeeRepository.getByEmail(data.email);
    if (duplicate && duplicate._id.toString() !== employeeId) {
      throw new ERROR.BadRequestError('Another employee with this email already exists.');
    }
  }

  if (data.name) employee.name = data.name;
  if (data.email) employee.email = data.email;
  if (data.role) employee.role = data.role;
  if (data.authorityLevel) employee.authorityLevel = data.authorityLevel;

  employee.updatedUser = new Types.ObjectId(adminId);
  employee.updatedAt = new Date();

  return await employeeRepository.update(employee);
};

const deleteEmployee = async (employeeId: string, adminId: string): Promise<IEmployee> => {
  validateUserAuthorization(adminId);
  validateRequiredField(employeeId, 'Employee ID is required');

  const employee = await employeeRepository.findById(employeeId);
  validateNotFound(employee, 'Employee');

  await employeeRepository.deleteById(employeeId);

  await employee;

  return employee;
};

const getHostsByEmployee = async (employeeId: string) => {
  if (!employeeId) {
    throw new ERROR.BadRequestError('Employee ID is required');
  }

  const hosts = await employeeRepository.getAssignedHosts(employeeId);

  return hosts;
};

const fetchChatSupportEmployees = async () => {
  const employees = await employeeRepository.getChatSupportEmployees();
  return employees;
};

const getAssignedHosts = async ({
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
  return await employeeRepository.getAssignedHostsAdmin({
    employeeId,
    pageNumber,
    pageSize,
    search,
  });
};

const fetchAllHostLocations = async () => {
  const locations = await employeeRepository.getAllHostLocations();
  return locations;
};

const fetchUniqueHostLocations = async () => {
  const locations = await employeeRepository.getUniqueHostLocations();
  return locations;
};

const fetchUniqueHostLanguages = async () => {
  const languages = await employeeRepository.getUniqueHostLanguages();
  return languages;
};

const fetchUniqueHostLocationsByEmployee = async () => {
  const locations = await employeeRepository.getUniqueHostLocations();
  return locations;
};

interface FetchChatsServiceOptions {
  hostId: string;
  userId: string;
  pageNumber?: number;
  pageSize?: number;
}

const getHostUserChatsEmployee = async ({ hostId, userId, pageNumber = 1, pageSize = 20 }: FetchChatsServiceOptions) => {
  const skip = (pageNumber - 1) * pageSize;
  const chats = await employeeRepository.fetchHostUserChatsRepoEmployee({ hostId, userId, skip, limit: pageSize });
  return chats;
};

export default {
  createEmployee,
  getEmployees,
  editEmployee,
  deleteEmployee,
  getHostsByEmployee,
  fetchChatSupportEmployees,
  getAssignedHosts,
  fetchAllHostLocations,
  fetchUniqueHostLocations,
  fetchUniqueHostLanguages,
  fetchUniqueHostLocationsByEmployee,
  getHostUserChatsEmployee,
};
