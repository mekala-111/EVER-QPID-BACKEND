class TicketCategoryEntity {
  documentStatus: boolean;
  categoryName: string;
  createdUser: string | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;

  constructor(
    documentStatus: boolean,
    categoryName: string,
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.categoryName = categoryName;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}

export default TicketCategoryEntity;
