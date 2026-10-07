class BlockEntity {
  documentStatus: boolean;
  blockedAccount: string;
  blockedBy: string;
  dateBlocked: Date | null;
  selectedReasons: string[];
  createdUser: string | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;
  constructor(
    documentStatus: boolean,
    blockedAccount: string,
    blockedBy: string,
    dateBlocked: Date | null,
    selectedReasons: string[],
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.blockedAccount = blockedAccount;
    this.blockedBy = blockedBy;
    this.dateBlocked = dateBlocked;
    this.selectedReasons = selectedReasons;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}
export default BlockEntity;
