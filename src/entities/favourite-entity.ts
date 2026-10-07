import { Types } from 'mongoose';

class FavoriteEntity {
  documentStatus: boolean;
  userId: Types.ObjectId;
  favProfileId: Types.ObjectId;
  createdUser: string | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;
  isPined: boolean;
  pinedOn: Date | null;
  constructor(
    documentStatus: boolean,
    userId: Types.ObjectId,
    favProfileId: Types.ObjectId,
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
    isPined: boolean,
    pinedOn: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.userId = userId;
    this.favProfileId = favProfileId;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
    this.isPined = isPined;
    this.pinedOn = pinedOn;
  }
}

export default FavoriteEntity;
