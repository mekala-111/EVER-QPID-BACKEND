import { Types } from 'mongoose';

class InterestEntity {
  documentStatus: boolean;
  interest: string;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;
  constructor(
    documentStatus: boolean,
    interest: string,
    createdUser: Types.ObjectId | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.interest = interest;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}

export default InterestEntity;
