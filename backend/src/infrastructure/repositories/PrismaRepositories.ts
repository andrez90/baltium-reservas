import { prisma } from '../database/prisma';
import { 
  ITenantRepository, 
  IUserRepository, 
  ITableRepository, 
  IReservationRepository, 
  IClientRepository, 
  IWaitlistRepository, 
  IConfigRepository, 
  IAuditLogRepository,
  IMenuItemRepository
} from '../../domain/repositories/interfaces';
import { Tenant, User, Table, Reservation, Client, Waitlist, Config, AuditLog, UserRole, TableStatus, ReservationStatus, CelebrationType, MenuItem } from '../../domain/entities';

export class PrismaTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const t = await prisma.tenant.findUnique({ where: { id } });
    return t ? (t as Tenant) : null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const t = await prisma.tenant.findUnique({ where: { domain } });
    return t ? (t as Tenant) : null;
  }

  async create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const t = await prisma.tenant.create({ data });
    return t as Tenant;
  }

  async update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant> {
    const t = await prisma.tenant.update({ where: { id }, data });
    return t as Tenant;
  }

  async findAll(): Promise<Tenant[]> {
    const ts = await prisma.tenant.findMany();
    return ts as Tenant[];
  }
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    return { ...u, role: u.role as UserRole };
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return null;
    return { ...u, role: u.role as UserRole };
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const u = await prisma.user.create({ data });
    return { ...u, role: u.role as UserRole };
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const u = await prisma.user.update({ where: { id }, data });
    return { ...u, role: u.role as UserRole };
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    const us = await prisma.user.findMany({ where: { tenantId } });
    return us.map(u => ({ ...u, role: u.role as UserRole }));
  }
}

export class PrismaTableRepository implements ITableRepository {
  async findById(id: string): Promise<Table | null> {
    const t = await prisma.table.findUnique({ where: { id } });
    if (!t) return null;
    return { ...t, status: t.status as TableStatus };
  }

  async findByTenant(tenantId: string): Promise<Table[]> {
    const ts = await prisma.table.findMany({ where: { tenantId } });
    return ts.map(t => ({ ...t, status: t.status as TableStatus }));
  }

  async create(data: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table> {
    const t = await prisma.table.create({ data });
    return { ...t, status: t.status as TableStatus };
  }

  async update(id: string, data: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Table> {
    const t = await prisma.table.update({ where: { id }, data });
    return { ...t, status: t.status as TableStatus };
  }

  async delete(id: string): Promise<void> {
    await prisma.table.delete({ where: { id } });
  }
}

export class PrismaReservationRepository implements IReservationRepository {
  async findById(id: string): Promise<Reservation | null> {
    const r = await prisma.reservation.findUnique({ where: { id } });
    if (!r) return null;
    return {
      ...r,
      status: r.status as ReservationStatus,
      celebration: r.celebration as CelebrationType
    };
  }

  async findByTenant(tenantId: string, filters?: { date?: string; status?: string }): Promise<Reservation[]> {
    const where: any = { tenantId };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      where.dateTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    const rs = await prisma.reservation.findMany({ where, orderBy: { dateTime: 'asc' } });
    return rs.map(r => ({
      ...r,
      status: r.status as ReservationStatus,
      celebration: r.celebration as CelebrationType
    }));
  }

  async create(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    const r = await prisma.reservation.create({ data });
    return {
      ...r,
      status: r.status as ReservationStatus,
      celebration: r.celebration as CelebrationType
    };
  }

  async update(id: string, data: Partial<Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Reservation> {
    const r = await prisma.reservation.update({ where: { id }, data });
    return {
      ...r,
      status: r.status as ReservationStatus,
      celebration: r.celebration as CelebrationType
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.reservation.delete({ where: { id } });
  }

  async findConflicting(tableId: string, dateTime: Date, durationMinutes: number): Promise<Reservation[]> {
    const bookingStart = new Date(dateTime);
    const bookingEnd = new Date(dateTime.getTime() + durationMinutes * 60000);

    const rs = await prisma.reservation.findMany({
      where: {
        tableId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        dateTime: {
          gte: new Date(bookingStart.getTime() - 2 * 60 * 60000), // Buffer of 2 hours before
          lte: bookingEnd
        }
      }
    });

    return rs.map(r => ({
      ...r,
      status: r.status as ReservationStatus,
      celebration: r.celebration as CelebrationType
    }));
  }
}

export class PrismaClientRepository implements IClientRepository {
  async findById(id: string): Promise<Client | null> {
    const c = await prisma.client.findUnique({ where: { id } });
    return c ? (c as Client) : null;
  }

  async findByTenant(tenantId: string): Promise<Client[]> {
    const cs = await prisma.client.findMany({ where: { tenantId } });
    return cs as Client[];
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<Client | null> {
    const c = await prisma.client.findUnique({
      where: {
        email_tenantId: { email, tenantId }
      }
    });
    return c ? (c as Client) : null;
  }

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const c = await prisma.client.create({ data });
    return c as Client;
  }

  async update(id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client> {
    const c = await prisma.client.update({ where: { id }, data });
    return c as Client;
  }

  async delete(id: string): Promise<void> {
    await prisma.client.delete({ where: { id } });
  }
}

export class PrismaWaitlistRepository implements IWaitlistRepository {
  async findById(id: string): Promise<Waitlist | null> {
    const w = await prisma.waitlist.findUnique({ where: { id } });
    return w ? (w as Waitlist) : null;
  }

  async findByTenant(tenantId: string): Promise<Waitlist[]> {
    const ws = await prisma.waitlist.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    return ws as Waitlist[];
  }

  async create(data: Omit<Waitlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Waitlist> {
    const w = await prisma.waitlist.create({ data });
    return w as Waitlist;
  }

  async delete(id: string): Promise<void> {
    await prisma.waitlist.delete({ where: { id } });
  }
}

export class PrismaConfigRepository implements IConfigRepository {
  async findByKeyAndTenant(key: string, tenantId: string): Promise<Config | null> {
    const c = await prisma.config.findUnique({
      where: {
        key_tenantId: { key, tenantId }
      }
    });
    return c ? (c as Config) : null;
  }

  async findByTenant(tenantId: string): Promise<Config[]> {
    const cs = await prisma.config.findMany({ where: { tenantId } });
    return cs as Config[];
  }

  async save(tenantId: string, key: string, value: string): Promise<Config> {
    const c = await prisma.config.upsert({
      where: { key_tenantId: { key, tenantId } },
      update: { value },
      create: { key, value, tenantId }
    });
    return c as Config;
  }
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const a = await prisma.auditLog.create({ data });
    return a as AuditLog;
  }

  async findByTenant(tenantId: string): Promise<AuditLog[]> {
    const as = await prisma.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return as as AuditLog[];
  }
}

export class PrismaMenuItemRepository implements IMenuItemRepository {
  async findById(id: string): Promise<MenuItem | null> {
    const m = await prisma.menuItem.findUnique({ where: { id } });
    return m ? (m as MenuItem) : null;
  }

  async findByTenant(tenantId: string): Promise<MenuItem[]> {
    const ms = await prisma.menuItem.findMany({ where: { tenantId }, orderBy: { category: 'asc' } });
    return ms as MenuItem[];
  }

  async create(data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
    const m = await prisma.menuItem.create({ data });
    return m as MenuItem;
  }

  async update(id: string, data: Partial<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<MenuItem> {
    const m = await prisma.menuItem.update({ where: { id }, data });
    return m as MenuItem;
  }

  async delete(id: string): Promise<void> {
    await prisma.menuItem.delete({ where: { id } });
  }
}

