import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../../infrastructure/security/auth';
import { UserRole } from '../../domain/entities';
import { logger } from '../../infrastructure/logs/logger';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error: any) {
    logger.warn(`Token validation failed: ${error.message}`);
    return res.status(403).json({ error: 'Token is invalid or expired' });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { role } = authReq.user;
    if (!allowedRoles.includes(role)) {
      logger.warn(`User ${authReq.user.userId} attempted unauthorized access to role protected resource. Role: ${role}`);
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
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
