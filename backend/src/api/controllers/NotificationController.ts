import { Request, Response } from 'express';
import { notificationSimulatorQueue } from '../../infrastructure/services/notification';

export class NotificationController {
  static getSimulatorMessages(req: Request, res: Response) {
    return res.status(200).json({
      notifications: notificationSimulatorQueue.slice(0, 50) // Return last 50
    });
  }
}
