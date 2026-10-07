/* eslint-disable prettier/prettier */
import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services';
import ApiResponse from '../utils/api-response';
import { parsePagination } from '../utils/pagination';
import { SupportEntity } from '../entities/support-entity';
import { AuthRequest } from '../middlewares/auth/verify-admin';
import ERROR from '../middlewares/web_server/http-error';

const getAllTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    const pagination = parsePagination(req);

    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const priority = (req.query.priority as string) || 'all';

    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    const result = await ticketService.listTickets(pagination, { search, status, priority });

    const apiResponse = new ApiResponse<typeof result>();
    apiResponse.message = 'Tickets fetched successfully';
    apiResponse.data = result;
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;
    const { employeeId } = req.body;
    const ticket = await ticketService.assignTicket(ticketId, employeeId);
    res.json({ status: 200, message: 'Ticket assigned successfully', data: ticket });
  } catch (err) {
    next(err);
  }
};

const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.body;
    const ticketData = req.body;

    const result = await ticketService.createTicket(adminId, ticketData);

    const apiResponse = new ApiResponse<typeof result>();
    apiResponse.message = 'Ticket created successfully';
    apiResponse.data = result;
    apiResponse.statusCode = 201;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

export interface SideProfileDetails {
  fullName: string;
  joinedDate: Date | null;
  lastActive: Date | null;
  phoneNo: string;
  email: string;
  isVerified: boolean;
  isSubscribed: boolean;
  totalMatches: number;
  totalSpend: number;
  openTickets: number;
  lastChatOn: Date | null;
}

const getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const result = await ticketService.getTicketById(ticketId);

    if (!result) {
      res.status(404).json({ status: 404, message: 'Ticket not found' });
      return;
    }

    const apiResponse = new ApiResponse<{
      ticket: SupportEntity;
      sideProfileDetails: SideProfileDetails | null;
      isClosed: boolean;
    }>();

    const closedStatuses = ['closed', 'cancelled'];

    apiResponse.message = 'Ticket fetched successfully';
    apiResponse.data = {
      ticket: result.ticket,
      sideProfileDetails: result.sideProfileDetails,
      isClosed: closedStatuses.includes(result.ticket.status),
    };
    apiResponse.statusCode = 200;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const closeTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const closedTicket = await ticketService.closeTicket(ticketId);

    if (!closedTicket) {
      res.status(404).json({ status: 404, message: 'Ticket not found' });
      return;
    }

    res.json({
      status: 200,
      message: 'Ticket closed successfully',
      data: closedTicket,
    });
  } catch (err) {
    next(err);
  }
};

const getUserTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;

    if (!adminId) throw new Error('Admin not authenticated');

    const tickets = await ticketService.getUserTickets(userId);

    const apiResponse = new ApiResponse();
    apiResponse.status = true;
    apiResponse.statusCode = 200;
    apiResponse.message = 'User tickets retrieved successfully';
    apiResponse.data = tickets;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const cancelTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const cancelledTicket = await ticketService.cancelTicket(ticketId);

    if (!cancelledTicket) {
      res.status(404).json({ status: 404, message: 'Ticket not found' });
      return;
    }

    res.json({
      status: 200,
      message: 'Ticket cancelled successfully',
      data: cancelledTicket,
    });
  } catch (err) {
    next(err);
  }
};

export default { getAllTickets, assignTicket, createTicket, getTicketById, closeTicket, getUserTickets, cancelTicket };
