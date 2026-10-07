import { Request } from 'express';

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

/**
 * Parses pagination params from the request query.
 * Defaults: pageNumber = 1, pageSize = 10
 */
export const parsePagination = (req: Request): PaginationParams => {
  const pageNumber = Math.max(parseInt(req.query.pageNumber as string) || 1, 1);
  const pageSize = Math.max(parseInt(req.query.pageSize as string) || 10, 1);

  return { pageNumber, pageSize };
};
