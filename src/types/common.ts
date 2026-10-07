export interface PaginationInput {
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasNext: boolean;
}

export type DurationUnit = 'Minutes' | 'Hours' | 'Days' | 'Weeks' | 'Months';

export enum PurchaseStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum PlanStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Expired = 'Expired',
  Payment_Pending = 'Payment_Pending',
}
