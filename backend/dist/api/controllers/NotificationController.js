"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_1 = require("../../infrastructure/services/notification");
class NotificationController {
    static getSimulatorMessages(req, res) {
        return res.status(200).json({
            notifications: notification_1.notificationSimulatorQueue.slice(0, 50) // Return last 50
        });
    }
}
exports.NotificationController = NotificationController;
