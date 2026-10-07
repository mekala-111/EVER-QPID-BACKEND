import nodemailer from 'nodemailer';
import config from '../config/config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.mail.sender_id,
    pass: config.mail.sender_password,
  },
});

/**
 * Send email with otp
 * @param email
 * @param otp
 */
const sendOTPEmail = async (email: string, otp: string) => {
  try {
    await transporter.sendMail({
      from: `Everqpid <${config.mail.sender_id}>`,
      to: email,
      subject: 'Everqpid: OTP for Email verification',
      text: `Your OTP for Everqpid Email verification is ${otp}.`,
    });
    console.log('Email sent!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export { sendOTPEmail };
