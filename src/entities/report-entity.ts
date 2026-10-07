import { Types } from 'mongoose';

export class ReportEntity {
  reporter: Types.ObjectId;
  reported: Types.ObjectId;
  reason: string;
  //details?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  documentStatus: boolean;

  constructor(
    reporter: Types.ObjectId,
    reported: Types.ObjectId,
    reason: string,
    //details: string,
    createdAt: Date | null,
    updatedAt: Date | null,
    documentStatus: boolean,
  ) {
    this.reporter = reporter;
    this.reported = reported;
    this.reason = reason;
    //this.details = details;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.documentStatus = documentStatus;
  }
}
