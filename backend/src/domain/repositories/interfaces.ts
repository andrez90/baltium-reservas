import { Tenant, User, Table, Reservation, Client, Waitlist, Config, AuditLog, MenuItem } from '../entities';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByDomain(domain: string): Promise<Tenant | null>;
  create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
  update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant>;
  findAll(): Promise<Tenant[]>;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>;
  delete(id: string): Promise<void>;
  findByTenant(tenantId: string): Promise<User[]>;
}

export interface ITableRepository {
  findById(id: string): Promise<Table | null>;
  findByTenant(tenantId: string): Promise<Table[]>;
  create(data: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table>;
  update(id: string, data: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Table>;
  delete(id: string): Promise<void>;
}

export interface IReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  findByTenant(tenantId: string, filters?: { date?: string; status?: string }): Promise<Reservation[]>;
  create(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation>;
  update(id: string, data: Partial<Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Reservation>;
  delete(id: string): Promise<void>;
  findConflicting(tableId: string, dateTime: Date, durationMinutes: number): Promise<Reservation[]>;
}

export interface IClientRepository {
  findById(id: string): Promise<Client | null>;
  findByTenant(tenantId: string): Promise<Client[]>;
  findByEmailAndTenant(email: string, tenantId: string): Promise<Client | null>;
  create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>;
  update(id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client>;
  delete(id: string): Promise<void>;
}

export interface IWaitlistRepository {
  findById(id: string): Promise<Waitlist | null>;
  findByTenant(tenantId: string): Promise<Waitlist[]>;
  create(data: Omit<Waitlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Waitlist>;
  delete(id: string): Promise<void>;
}

export interface IConfigRepository {
  findByKeyAndTenant(key: string, tenantId: string): Promise<Config | null>;
  findByTenant(tenantId: string): Promise<Config[]>;
  save(tenantId: string, key: string, value: string): Promise<Config>;
}

export interface IAuditLogRepository {
  create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  findByTenant(tenantId: string): Promise<AuditLog[]>;
}

export interface IMenuItemRepository {
  findById(id: string): Promise<MenuItem | null>;
  findByTenant(tenantId: string): Promise<MenuItem[]>;
  create(data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem>;
  update(id: string, data: Partial<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<MenuItem>;
  delete(id: string): Promise<void>;
}

