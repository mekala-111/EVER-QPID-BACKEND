class MatchingEntity {
  documentStatus: boolean;
  fromUserId: string;
  toUserId: string;
  createdUser: string | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;
  isSuperLike: boolean;
  constructor(
    documentStatus: boolean,
    fromUserId: string,
    toUserId: string,
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
    isSuperLike: boolean = false,
  ) {
    this.documentStatus = documentStatus;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
    this.isSuperLike = isSuperLike;
  }
}

export default MatchingEntity;
