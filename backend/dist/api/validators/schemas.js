"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMenuItemSchema = exports.createMenuItemSchema = exports.createWaitlistSchema = exports.createClientSchema = exports.updateReservationSchema = exports.createReservationSchema = exports.updateTableLayoutSchema = exports.createTableSchema = exports.createTenantSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    firstName: zod_1.z.string().min(2, 'First name is too short'),
    lastName: zod_1.z.string().min(2, 'Last name is too short'),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ADMIN', 'RECEPTION', 'WAITER', 'CASHIER', 'CUSTOMER']),
    phone: zod_1.z.string().optional(),
    tenantId: zod_1.z.string().uuid().optional(),
});
exports.createTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Tenant name must be at least 2 characters'),
    domain: zod_1.z.string().min(3, 'Domain must be at least 3 characters'),
    logo: zod_1.z.string().url().optional().nullable(),
    primaryColor: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryColor: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    schedule: zod_1.z.string().optional(), // Expects JSON array string of hours
    configuration: zod_1.z.string().optional(), // Expects JSON object string of configs
});
exports.createTableSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Table name is required'),
    capacity: zod_1.z.number().int().positive('Capacity must be positive'),
    status: zod_1.z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE']).optional(),
    x: zod_1.z.number().int().nonnegative().optional(),
    y: zod_1.z.number().int().nonnegative().optional(),
    width: zod_1.z.number().int().positive().optional(),
    height: zod_1.z.number().int().positive().optional(),
    shape: zod_1.z.string().optional(),
    zone: zod_1.z.string().optional(),
});
exports.updateTableLayoutSchema = zod_1.z.object({
    tables: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        x: zod_1.z.number(),
        y: zod_1.z.number(),
        width: zod_1.z.number().optional(),
        height: zod_1.z.number().optional(),
        status: zod_1.z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE']).optional(),
    }))
});
exports.createReservationSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(2, 'Client name is required'),
    clientPhone: zod_1.z.string().min(5, 'Client phone is required'),
    clientEmail: zod_1.z.string().email('Invalid client email'),
    dateTime: zod_1.z.string().transform((val) => new Date(val)),
    partySize: zod_1.z.number().int().positive('Party size must be positive'),
    zone: zod_1.z.string().optional().default('MAIN'),
    celebration: zod_1.z.enum(['NONE', 'BIRTHDAY', 'ANNIVERSARY', 'OTHER']).optional().default('NONE'),
    notes: zod_1.z.string().optional().nullable(),
    tableId: zod_1.z.string().uuid().optional().nullable(),
    tablePurchased: zod_1.z.boolean().optional().default(false),
    purchaseAmount: zod_1.z.number().optional().nullable(),
    purchasePaymentMethod: zod_1.z.string().optional().nullable(),
});
exports.updateReservationSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    tableId: zod_1.z.string().uuid().optional().nullable(),
    dateTime: zod_1.z.string().transform((val) => new Date(val)).optional(),
    partySize: zod_1.z.number().int().positive().optional(),
    notes: zod_1.z.string().optional().nullable(),
    tablePurchased: zod_1.z.boolean().optional(),
    purchaseAmount: zod_1.z.number().optional().nullable(),
    purchasePaymentMethod: zod_1.z.string().optional().nullable(),
});
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Client name is required'),
    phone: zod_1.z.string().min(5, 'Phone number is required'),
    email: zod_1.z.string().email('Invalid email address'),
    birthday: zod_1.z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    anniversary: zod_1.z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    notes: zod_1.z.string().optional().nullable(),
    tags: zod_1.z.string().optional(), // Expects JSON array string
    isVip: zod_1.z.boolean().optional(),
});
exports.createWaitlistSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(2, 'Client name is required'),
    clientPhone: zod_1.z.string().min(5, 'Client phone is required'),
    clientEmail: zod_1.z.string().email('Invalid email address'),
    partySize: zod_1.z.number().int().positive('Party size must be positive'),
    zone: zod_1.z.string().optional().default('MAIN'),
    notes: zod_1.z.string().optional().nullable(),
});
exports.createMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional().nullable(),
    price: zod_1.z.number().positive('Price must be positive'),
    category: zod_1.z.enum(['ENTRADA', 'PLATO_FUERTE', 'POSTRE', 'BEBIDA']),
    imageUrl: zod_1.z.string().optional().nullable(),
    available: zod_1.z.boolean().optional().default(true),
});
exports.updateMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
    price: zod_1.z.number().positive().optional(),
    category: zod_1.z.enum(['ENTRADA', 'PLATO_FUERTE', 'POSTRE', 'BEBIDA']).optional(),
    imageUrl: zod_1.z.string().optional().nullable(),
    available: zod_1.z.boolean().optional(),
});
