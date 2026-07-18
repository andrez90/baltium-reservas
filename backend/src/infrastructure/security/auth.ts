import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities';

const JWT_SECRET = process.env.JWT_SECRET || 'baltium_super_secure_jwt_access_secret_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'baltium_super_secure_jwt_refresh_secret_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
