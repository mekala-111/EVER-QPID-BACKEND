import { Types } from 'mongoose';

export class EmployeeEntity {
  name: string;
  email: string;
  role: 'Manager' | 'Chat Support' | 'Customer Support' | 'Marketing';
  authorityLevel: 'Full Access' | 'View Access' | 'Edit Access' | 'View & Edit Access';
  password: string | null;
  otp: string | null;
  otpExpiry: Date | null;
  userType: 'employee';
  createdByAdmin: string | Types.ObjectId;
  createdAt: Date;
  documentStatus: boolean;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;

  constructor(
    name: string,
    email: string,
    role: 'Manager' | 'Chat Support' | 'Customer Support' | 'Marketing',
    authorityLevel: 'Full Access' | 'View Access' | 'Edit Access' | 'View & Edit Access',
    password: string | null = null,
    otp: string | null = null,
    otpExpiry: Date | null = null,
    createdByAdmin: string | Types.ObjectId,
    createdAt: Date,
    documentStatus: boolean = true,
    updatedUser: Types.ObjectId | null = null,
    updatedAt: Date | null = null,
  ) {
    this.name = name;
    this.email = email;
    this.role = role;
    this.authorityLevel = authorityLevel;
    this.password = password;
    this.otp = otp;
    this.otpExpiry = otpExpiry;
    this.userType = 'employee';
    this.createdByAdmin = createdByAdmin;
    this.createdAt = createdAt;
    this.documentStatus = documentStatus;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}
