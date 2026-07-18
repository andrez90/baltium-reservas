"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenant = exports.requireRole = exports.authenticateToken = void 0;
const auth_1 = require("../../infrastructure/security/auth");
const logger_1 = require("../../infrastructure/logs/logger");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token is missing' });
    }
    try {
        const payload = (0, auth_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        logger_1.logger.warn(`Token validation failed: ${error.message}`);
        return res.status(403).json({ error: 'Token is invalid or expired' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { role } = authReq.user;
        if (!allowedRoles.includes(role)) {
            logger_1.logger.warn(`User ${authReq.user.userId} attempted unauthorized access to role protected resource. Role: ${role}`);
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireTenant = (req, res, next) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Super Admins don't belong to a specific tenant and can specify tenantId in query/body
    if (authReq.user.role === 'SUPER_ADMIN') {
        next();
        return;
    }
    if (!authReq.user.tenantId) {
        return res.status(400).json({ error: 'Tenant context is missing from user session' });
    }
    next();
};
exports.requireTenant = requireTenant;
