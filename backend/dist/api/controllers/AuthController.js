"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const PrismaRepositories_1 = require("../../infrastructure/repositories/PrismaRepositories");
const auth_1 = require("../../infrastructure/security/auth");
const logger_1 = require("../../infrastructure/logs/logger");
const userRepo = new PrismaRepositories_1.PrismaUserRepository();
const tenantRepo = new PrismaRepositories_1.PrismaTenantRepository();
class AuthController {
    static async register(req, res) {
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
            const passwordHash = await (0, auth_1.hashPassword)(password);
            const newUser = await userRepo.create({
                email,
                passwordHash,
                firstName,
                lastName,
                role: role,
                phone,
                tenantId: tenantId || null,
                is2faEnabled: false,
                twoFactorSecret: null,
                isVerified: false,
                refreshToken: null
            });
            logger_1.logger.info(`User registered successfully: ${email} with role ${role}`);
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
        }
        catch (error) {
            logger_1.logger.error(`Registration error: ${error.message}`);
            return res.status(500).json({ error: 'Error during user registration' });
        }
    }
    static async login(req, res) {
        const { email, password, rememberMe } = req.body;
        try {
            const user = await userRepo.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            const isMatch = await (0, auth_1.comparePassword)(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            };
            const accessToken = (0, auth_1.generateAccessToken)(payload);
            const refreshToken = (0, auth_1.generateRefreshToken)(payload);
            // Save refresh token to user DB
            await userRepo.update(user.id, { refreshToken });
            let tenantInfo = null;
            if (user.tenantId) {
                tenantInfo = await tenantRepo.findById(user.tenantId);
            }
            logger_1.logger.info(`User logged in: ${email}`);
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
        }
        catch (error) {
            logger_1.logger.error(`Login error: ${error.message}`);
            return res.status(500).json({ error: 'Error during login' });
        }
    }
    static async refresh(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        try {
            const payload = (0, auth_1.verifyRefreshToken)(refreshToken);
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
            const accessToken = (0, auth_1.generateAccessToken)(newPayload);
            const newRefreshToken = (0, auth_1.generateRefreshToken)(newPayload);
            await userRepo.update(user.id, { refreshToken: newRefreshToken });
            return res.status(200).json({
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: '15m'
            });
        }
        catch (error) {
            logger_1.logger.warn(`Token refresh failed: ${error.message}`);
            return res.status(403).json({ error: 'Invalid refresh token session' });
        }
    }
    static async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const user = await userRepo.findByEmail(email);
            if (!user) {
                // Return 200 to prevent user enumeration
                return res.status(200).json({ message: 'If the email exists, a password recovery link has been sent' });
            }
            // Simulate sending email
            logger_1.logger.info(`[RECOVERY SIMULATION] Password recovery link sent to ${email}`);
            return res.status(200).json({
                message: 'If the email exists, a password recovery link has been sent',
                debugSimulationLink: `/reset-password?token=mock_token_for_${user.id}`
            });
        }
        catch (error) {
            logger_1.logger.error(`Password recovery error: ${error.message}`);
            return res.status(500).json({ error: 'Error processing request' });
        }
    }
    static async getMe(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error(`Get profile error: ${error.message}`);
            return res.status(500).json({ error: 'Error fetching user profile' });
        }
    }
}
exports.AuthController = AuthController;
