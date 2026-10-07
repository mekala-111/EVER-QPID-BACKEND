import ERROR from '../middlewares/web_server/http-error';
import { ticketRepository } from '../repositories';

const listTickets = async (pagination: { pageNumber: number; pageSize: number }, filters: { search: string; status: string; priority: string }) => {
  return ticketRepository.getAllTickets(pagination, filters);
};

const assignTicket = async (ticketId: string, employeeId: string) => {
  return ticketRepository.assignTicketToEmployee(ticketId, employeeId);
};

const createTicket = async (adminId: string, ticketData: any) => {
  if (!adminId) throw new ERROR.AuthorizationError('UnAuthorized');

  return ticketRepository.createTicket(ticketData);
};

const getTicketById = async (ticketId: string) => {
  if (!ticketId) throw new ERROR.BadRequestError('Ticket ID is required');

  return ticketRepository.getTicketById(ticketId);
};

const closeTicket = async (ticketId: string) => {
  if (!ticketId) throw new ERROR.BadRequestError('Ticket ID is required');

  return ticketRepository.closeTicket(ticketId);
};

const getUserTickets = async (userId: string) => {
  const tickets = await ticketRepository.findByUserId(userId);

  return tickets.map((ticket) => ({
    ticketId: ticket._id,
    createdAt: ticket.createdAt,
    reason: ticket.subject || ticket.category,
    priority: ticket.priority,
    status: ticket.status,
  }));
};

const cancelTicket = async (ticketId: string) => {
  if (!ticketId) throw new ERROR.BadRequestError('Ticket ID is required');

  return ticketRepository.cancelTicket(ticketId);
};

export default { listTickets, assignTicket, createTicket, getTicketById, closeTicket, getUserTickets, cancelTicket };
