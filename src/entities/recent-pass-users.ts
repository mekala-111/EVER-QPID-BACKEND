import { Types } from 'mongoose';
class RecentPassUsersEntity {
  documentStatus: boolean;
  userId: Types.ObjectId;
  recentPassUser: Types.ObjectId;
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;

  constructor(
    documentStatus: boolean,
    userId: Types.ObjectId,
    recentPassUser: Types.ObjectId,
    createdUser: Types.ObjectId | null,
    createdAt: Date | null,
    updatedUser: Types.ObjectId | null,
    updatedAt: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.userId = userId;
    this.recentPassUser = recentPassUser;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}

export default RecentPassUsersEntity;
