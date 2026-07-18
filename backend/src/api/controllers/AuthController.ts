import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PrismaUserRepository, PrismaTenantRepository } from '../../infrastructure/repositories/PrismaRepositories';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../infrastructure/security/auth';
import { logger } from '../../infrastructure/logs/logger';
import { UserRole } from '../../domain/entities';

const userRepo = new PrismaUserRepository();
const tenantRepo = new PrismaTenantRepository();

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    const { email, password, firstName, lastName, role, phone, tenantId } = req.body;

    try {
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Check tenant validity if provided
      if (tenantId) {
        const tenant = await tenantRepo.findById(tenantId);
        if (!tenant) {
          return res.status(404).json({ error: 'Tenant restaurant not found' });
        }
      }

      const passwordHash = await hashPassword(password);
      const newUser = await userRepo.create({
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as UserRole,
        phone,
        tenantId: tenantId || null,
        is2faEnabled: false,
        twoFactorSecret: null,
        isVerified: false,
        refreshToken: null
      });

      logger.info(`User registered successfully: ${email} with role ${role}`);
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          tenantId: newUser.tenantId
        }
      });
    } catch (error: any) {
      logger.error(`Registration error: ${error.message}`);
      return res.status(500).json({ error: 'Error during user registration' });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    const { email, password, rememberMe } = req.body;

    try {
      const user = await userRepo.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Save refresh token to user DB
      await userRepo.update(user.id, { refreshToken });

      let tenantInfo = null;
      if (user.tenantId) {
        tenantInfo = await tenantRepo.findById(user.tenantId);
      }

      logger.info(`User logged in: ${email}`);

      // Set cookie if needed, or send as payload
      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        expiresIn: '15m',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          is2faEnabled: user.is2faEnabled
        },
        tenant: tenantInfo
      });
    } catch (error: any) {
      logger.error(`Login error: ${error.message}`);
      return res.status(500).json({ error: 'Error during login' });
    }
  }

  static async refresh(req: AuthenticatedRequest, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await userRepo.findById(payload.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const newPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      };

      const accessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      await userRepo.update(user.id, { refreshToken: newRefreshToken });

      return res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: '15m'
      });
    } catch (error: any) {
      logger.warn(`Token refresh failed: ${error.message}`);
      return res.status(403).json({ error: 'Invalid refresh token session' });
    }
  }

  static async forgotPassword(req: AuthenticatedRequest, res: Response) {
    const { email } = req.body;
    try {
      const user = await userRepo.findByEmail(email);
      if (!user) {
        // Return 200 to prevent user enumeration
        return res.status(200).json({ message: 'If the email exists, a password recovery link has been sent' });
      }

      // Simulate sending email
      logger.info(`[RECOVERY SIMULATION] Password recovery link sent to ${email}`);
      return res.status(200).json({
        message: 'If the email exists, a password recovery link has been sent',
        debugSimulationLink: `/reset-password?token=mock_token_for_${user.id}`
      });
    } catch (error: any) {
      logger.error(`Password recovery error: ${error.message}`);
      return res.status(500).json({ error: 'Error processing request' });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await userRepo.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let tenantInfo = null;
      if (user.tenantId) {
        tenantInfo = await tenantRepo.findById(user.tenantId);
      }

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          is2faEnabled: user.is2faEnabled
        },
        tenant: tenantInfo
      });
    } catch (error: any) {
      logger.error(`Get profile error: ${error.message}`);
      return res.status(500).json({ error: 'Error fetching user profile' });
    }
  }
}
