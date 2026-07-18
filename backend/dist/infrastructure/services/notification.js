"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMSNotification = exports.sendWhatsAppNotification = exports.sendEmailNotification = exports.notificationSimulatorQueue = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../logs/logger");
// In-memory simulation queue so users can preview sent notifications in the dashboard.
exports.notificationSimulatorQueue = [];
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
    },
});
const sendEmailNotification = async (to, subject, text, html) => {
    const notif = {
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
            logger_1.logger.info(`Email successfully sent to ${to}: ${subject}`);
        }
        else {
            logger_1.logger.info(`[SIMULATION] Email sent to ${to}: ${subject}`);
        }
        exports.notificationSimulatorQueue.unshift(notif);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error sending email to ${to}: ${error.message}`);
        notif.status = 'FAILED';
        notif.message += ` | Error: ${error.message}`;
        exports.notificationSimulatorQueue.unshift(notif);
        return false;
    }
};
exports.sendEmailNotification = sendEmailNotification;
const sendWhatsAppNotification = async (phone, message) => {
    const notif = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'WHATSAPP',
        to: phone,
        message,
        timestamp: new Date(),
        status: 'SENT'
    };
    try {
        logger_1.logger.info(`[SIMULATION] WhatsApp message sent to ${phone}: ${message}`);
        exports.notificationSimulatorQueue.unshift(notif);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error sending WhatsApp to ${phone}: ${error.message}`);
        notif.status = 'FAILED';
        exports.notificationSimulatorQueue.unshift(notif);
        return false;
    }
};
exports.sendWhatsAppNotification = sendWhatsAppNotification;
const sendSMSNotification = async (phone, message) => {
    const notif = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'SMS',
        to: phone,
        message,
        timestamp: new Date(),
        status: 'SENT'
    };
    try {
        logger_1.logger.info(`[SIMULATION] SMS sent to ${phone}: ${message}`);
        exports.notificationSimulatorQueue.unshift(notif);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error sending SMS to ${phone}: ${error.message}`);
        notif.status = 'FAILED';
        exports.notificationSimulatorQueue.unshift(notif);
        return false;
    }
};
exports.sendSMSNotification = sendSMSNotification;
