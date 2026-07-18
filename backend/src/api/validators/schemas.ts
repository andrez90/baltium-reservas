import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(2, 'Last name is too short'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'RECEPTION', 'WAITER', 'CASHIER', 'CUSTOMER']),
  phone: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters'),
  domain: z.string().min(3, 'Domain must be at least 3 characters'),
  logo: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  schedule: z.string().optional(), // Expects JSON array string of hours
  configuration: z.string().optional(), // Expects JSON object string of configs
});

export const createTableSchema = z.object({
  name: z.string().min(1, 'Table name is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  status: z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE']).optional(),
  x: z.number().int().nonnegative().optional(),
  y: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  shape: z.string().optional(),
  zone: z.string().optional(),
});

export const updateTableLayoutSchema = z.object({
  tables: z.array(z.object({
    id: z.string().uuid(),
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE']).optional(),
  }))
});

export const createReservationSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  clientPhone: z.string().min(5, 'Client phone is required'),
  clientEmail: z.string().email('Invalid client email'),
  dateTime: z.string().transform((val) => new Date(val)),
  partySize: z.number().int().positive('Party size must be positive'),
  zone: z.string().optional().default('MAIN'),
  celebration: z.enum(['NONE', 'BIRTHDAY', 'ANNIVERSARY', 'OTHER']).optional().default('NONE'),
  notes: z.string().optional().nullable(),
  tableId: z.string().uuid().optional().nullable(),
  tablePurchased: z.boolean().optional().default(false),
  purchaseAmount: z.number().optional().nullable(),
  purchasePaymentMethod: z.string().optional().nullable(),
});

export const updateReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  tableId: z.string().uuid().optional().nullable(),
  dateTime: z.string().transform((val) => new Date(val)).optional(),
  partySize: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  tablePurchased: z.boolean().optional(),
  purchaseAmount: z.number().optional().nullable(),
  purchasePaymentMethod: z.string().optional().nullable(),
});

export const createClientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  birthday: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  anniversary: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  notes: z.string().optional().nullable(),
  tags: z.string().optional(), // Expects JSON array string
  isVip: z.boolean().optional(),
});

export const createWaitlistSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  clientPhone: z.string().min(5, 'Client phone is required'),
  clientEmail: z.string().email('Invalid email address'),
  partySize: z.number().int().positive('Party size must be positive'),
  zone: z.string().optional().default('MAIN'),
  notes: z.string().optional().nullable(),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['ENTRADA', 'PLATO_FUERTE', 'POSTRE', 'BEBIDA']),
  imageUrl: z.string().optional().nullable(),
  available: z.boolean().optional().default(true),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  category: z.enum(['ENTRADA', 'PLATO_FUERTE', 'POSTRE', 'BEBIDA']).optional(),
  imageUrl: z.string().optional().nullable(),
  available: z.boolean().optional(),
});
