import ERROR from '../middlewares/web_server/http-error';
import { ISupport } from '../models/support/support-model';
import supportRepository from '../repositories/support-repository';
import nodemailer from 'nodemailer';
import { Types } from 'mongoose';

const MAIL_SENDER_ID = process.env.MAIL_SENDER_ID || 'example@gmail.com';
const MAIL_SENDER_PASSWORD = process.env.MAIL_SENDER_PASSWORD || 'yourpassword';

const sendSupport = async (data: ISupport) => {
  const savedSupport = await supportRepository.createSupport(data);

  const result = savedSupport.toObject();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MAIL_SENDER_ID,
      pass: MAIL_SENDER_PASSWORD,
    },
  });

  const mailOptions = {
    from: MAIL_SENDER_ID,
    to: data.email,
    subject: `Support Request Received - ${data.category}`,
    html: `
      <h3>Hello ${data.firstName},</h3>
      <p>We’ve received your support request:</p>
      <p><b>Subject:</b> ${data.subject}</p>
      <p><b>Category:</b> ${result.category}</p>
      <p><b>Description:</b> ${data.description}</p>
      <p>Our team will get back to you shortly.</p>
      <br/>
      <p>Thank you,<br/>Everqpid Support Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  return result;
};

const getSupports = async (userId: Types.ObjectId): Promise<ISupport[]> => {
  if (!userId) throw new ERROR.AuthorizationError('UnAuthorized');
  return await supportRepository.getSupports();
};

const updateSupportStatus = async (ticketId: string, status: 'open' | 'closed'): Promise<ISupport | null> => {
  return await supportRepository.updateSupportStatus(ticketId, status);
};

const getSupportById = async (ticketId: string): Promise<ISupport | null> => {
  return await supportRepository.getSupportById(ticketId);
};

export default {
  sendSupport,
  getSupports,
  updateSupportStatus,
  getSupportById,
};
