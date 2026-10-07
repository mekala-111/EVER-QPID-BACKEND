class AdminEntity {
  public documentStatus: boolean;
  public adminUserName: string;
  public adminUserType: string;
  public email: string;
  public password: string;
  public createdUser: string | null;
  public createdAt: Date | null;
  public updatedUser: string | null;
  public updatedAt: Date | null;

  constructor(
    documentStatus: boolean,
    adminUserName: string,
    adminUserType: string,
    email: string,
    password: string,
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.adminUserName = adminUserName;
    this.adminUserType = adminUserType;
    this.email = email;
    this.password = password;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}

export default AdminEntity;
