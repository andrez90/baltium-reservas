export interface Tenant {
  id: string;
  name: string;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
  domain: string;
  schedule: string; // JSON string of working hours
  tableCount: number;
  capacity: number;
  configuration: string; // JSON string of configurations
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'RECEPTION' | 'WAITER' | 'CASHIER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  tenantId?: string | null;
  is2faEnabled: boolean;
  twoFactorSecret?: string | null;
  isVerified: boolean;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'OUT_OF_SERVICE';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangular' | 'round' | string;
  zone: 'MAIN' | 'TERRACE' | 'VIP' | 'BAR' | string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type CelebrationType = 'NONE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'OTHER';

export interface Reservation {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  dateTime: Date;
  partySize: number;
  zone: string;
  status: ReservationStatus;
  celebration: CelebrationType;
  notes?: string | null;
  tableId?: string | null;
  tenantId: string;
  clientId?: string | null;
  isWaitlist: boolean;
  tablePurchased?: boolean;
  purchaseAmount?: number | null;
  purchasePaymentMethod?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday?: Date | null;
  anniversary?: Date | null;
  notes?: string | null;
  tags: string; // JSON string array of tags (e.g. VIP, Frecuente, Nuevo)
  isVip: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Waitlist {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  partySize: number;
  zone: string;
  notes?: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Config {
  id: string;
  key: string;
  value: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  details: string; // JSON string
  ipAddress?: string | null;
  tenantId: string;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string; // ENTRADA, PLATO_FUERTE, POSTRE, BEBIDA
  imageUrl?: string | null;
  available: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

