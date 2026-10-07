export class AdminEmailEntity {
  email: string;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(email: string, createdAt: Date | null = null, updatedAt: Date | null = null) {
    this.email = email;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
