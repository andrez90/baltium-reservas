import nodemailer from 'nodemailer';
import { logger } from '../logs/logger';

export interface SentNotification {
  id: string;
  type: 'EMAIL' | 'WHATSAPP' | 'SMS';
  to: string;
  subject?: string;
  message: string;
  timestamp: Date;
  status: 'SENT' | 'FAILED';
}

// In-memory simulation queue so users can preview sent notifications in the dashboard.
export const notificationSimulatorQueue: SentNotification[] = [];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

export const sendEmailNotification = async (to: string, subject: string, text: string, html: string): Promise<boolean> => {
  const notif: SentNotification = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'EMAIL',
    to,
    subject,
    message: text,
    timestamp: new Date(),
    status: 'SENT'
  };

  try {
    if (process.env.SMTP_USER !== 'mock_user') {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@baltiumreservas.com',
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email successfully sent to ${to}: ${subject}`);
    } else {
      logger.info(`[SIMULATION] Email sent to ${to}: ${subject}`);
    }
    notificationSimulatorQueue.unshift(notif);
    return true;
  } catch (error: any) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    notif.status = 'FAILED';
    notif.message += ` | Error: ${error.message}`;
    notificationSimulatorQueue.unshift(notif);
    return false;
  }
};

export const sendWhatsAppNotification = async (phone: string, message: string): Promise<boolean> => {
  const notif: SentNotification = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'WHATSAPP',
    to: phone,
    message,
    timestamp: new Date(),
    status: 'SENT'
  };

  try {
    logger.info(`[SIMULATION] WhatsApp message sent to ${phone}: ${message}`);
    notificationSimulatorQueue.unshift(notif);
    return true;
  } catch (error: any) {
    logger.error(`Error sending WhatsApp to ${phone}: ${error.message}`);
    notif.status = 'FAILED';
    notificationSimulatorQueue.unshift(notif);
    return false;
  }
};

export const sendSMSNotification = async (phone: string, message: string): Promise<boolean> => {
  const notif: SentNotification = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'SMS',
    to: phone,
    message,
    timestamp: new Date(),
    status: 'SENT'
  };

  try {
    logger.info(`[SIMULATION] SMS sent to ${phone}: ${message}`);
    notificationSimulatorQueue.unshift(notif);
    return true;
  } catch (error: any) {
    logger.error(`Error sending SMS to ${phone}: ${error.message}`);
    notif.status = 'FAILED';
    notificationSimulatorQueue.unshift(notif);
    return false;
  }
};
