import { Types } from 'mongoose';

export class SupportEntity {
  ticketId?: string;
  documentStatus: boolean;
  userId: Types.ObjectId;
  email: string;
  firstName: string;
  category: string;
  subject: string;
  description: string;
  attachments?: string[];
  status: 'open' | 'pending' | 'closed';
  assignedTo?: Types.ObjectId | null;
  priority: string;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(
    documentStatus: boolean,
    userId: Types.ObjectId,
    email: string,
    firstName: string,
    category: string,
    subject: string,
    description: string,
    attachments: string[],
    status: 'open' | 'closed',
    assignedTo: Types.ObjectId | null,
    priority: 'low' | 'medium' | 'high',
    createdAt: Date | null,
    updatedAt: Date | null,
    ticketId?: string,
  ) {
    this.ticketId = ticketId;
    this.documentStatus = documentStatus;
    this.userId = userId;
    this.email = email;
    this.firstName = firstName;
    this.category = category;
    this.subject = subject;
    this.description = description;
    this.attachments = attachments;
    this.status = status;
    this.assignedTo = assignedTo;
    this.priority = priority;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
