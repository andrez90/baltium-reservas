"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaMenuItemRepository = exports.PrismaAuditLogRepository = exports.PrismaConfigRepository = exports.PrismaWaitlistRepository = exports.PrismaClientRepository = exports.PrismaReservationRepository = exports.PrismaTableRepository = exports.PrismaUserRepository = exports.PrismaTenantRepository = void 0;
const prisma_1 = require("../database/prisma");
class PrismaTenantRepository {
    async findById(id) {
        const t = await prisma_1.prisma.tenant.findUnique({ where: { id } });
        return t ? t : null;
    }
    async findByDomain(domain) {
        const t = await prisma_1.prisma.tenant.findUnique({ where: { domain } });
        return t ? t : null;
    }
    async create(data) {
        const t = await prisma_1.prisma.tenant.create({ data });
        return t;
    }
    async update(id, data) {
        const t = await prisma_1.prisma.tenant.update({ where: { id }, data });
        return t;
    }
    async findAll() {
        const ts = await prisma_1.prisma.tenant.findMany();
        return ts;
    }
}
exports.PrismaTenantRepository = PrismaTenantRepository;
class PrismaUserRepository {
    async findById(id) {
        const u = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!u)
            return null;
        return { ...u, role: u.role };
    }
    async findByEmail(email) {
        const u = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!u)
            return null;
        return { ...u, role: u.role };
    }
    async create(data) {
        const u = await prisma_1.prisma.user.create({ data });
        return { ...u, role: u.role };
    }
    async update(id, data) {
        const u = await prisma_1.prisma.user.update({ where: { id }, data });
        return { ...u, role: u.role };
    }
    async delete(id) {
        await prisma_1.prisma.user.delete({ where: { id } });
    }
    async findByTenant(tenantId) {
        const us = await prisma_1.prisma.user.findMany({ where: { tenantId } });
        return us.map(u => ({ ...u, role: u.role }));
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
class PrismaTableRepository {
    async findById(id) {
        const t = await prisma_1.prisma.table.findUnique({ where: { id } });
        if (!t)
            return null;
        return { ...t, status: t.status };
    }
    async findByTenant(tenantId) {
        const ts = await prisma_1.prisma.table.findMany({ where: { tenantId } });
        return ts.map(t => ({ ...t, status: t.status }));
    }
    async create(data) {
        const t = await prisma_1.prisma.table.create({ data });
        return { ...t, status: t.status };
    }
    async update(id, data) {
        const t = await prisma_1.prisma.table.update({ where: { id }, data });
        return { ...t, status: t.status };
    }
    async delete(id) {
        await prisma_1.prisma.table.delete({ where: { id } });
    }
}
exports.PrismaTableRepository = PrismaTableRepository;
class PrismaReservationRepository {
    async findById(id) {
        const r = await prisma_1.prisma.reservation.findUnique({ where: { id } });
        if (!r)
            return null;
        return {
            ...r,
            status: r.status,
            celebration: r.celebration
        };
    }
    async findByTenant(tenantId, filters) {
        const where = { tenantId };
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
        const rs = await prisma_1.prisma.reservation.findMany({ where, orderBy: { dateTime: 'asc' } });
        return rs.map(r => ({
            ...r,
            status: r.status,
            celebration: r.celebration
        }));
    }
    async create(data) {
        const r = await prisma_1.prisma.reservation.create({ data });
        return {
            ...r,
            status: r.status,
            celebration: r.celebration
        };
    }
    async update(id, data) {
        const r = await prisma_1.prisma.reservation.update({ where: { id }, data });
        return {
            ...r,
            status: r.status,
            celebration: r.celebration
        };
    }
    async delete(id) {
        await prisma_1.prisma.reservation.delete({ where: { id } });
    }
    async findConflicting(tableId, dateTime, durationMinutes) {
        const bookingStart = new Date(dateTime);
        const bookingEnd = new Date(dateTime.getTime() + durationMinutes * 60000);
        const rs = await prisma_1.prisma.reservation.findMany({
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
            status: r.status,
            celebration: r.celebration
        }));
    }
}
exports.PrismaReservationRepository = PrismaReservationRepository;
class PrismaClientRepository {
    async findById(id) {
        const c = await prisma_1.prisma.client.findUnique({ where: { id } });
        return c ? c : null;
    }
    async findByTenant(tenantId) {
        const cs = await prisma_1.prisma.client.findMany({ where: { tenantId } });
        return cs;
    }
    async findByEmailAndTenant(email, tenantId) {
        const c = await prisma_1.prisma.client.findUnique({
            where: {
                email_tenantId: { email, tenantId }
            }
        });
        return c ? c : null;
    }
    async create(data) {
        const c = await prisma_1.prisma.client.create({ data });
        return c;
    }
    async update(id, data) {
        const c = await prisma_1.prisma.client.update({ where: { id }, data });
        return c;
    }
    async delete(id) {
        await prisma_1.prisma.client.delete({ where: { id } });
    }
}
exports.PrismaClientRepository = PrismaClientRepository;
class PrismaWaitlistRepository {
    async findById(id) {
        const w = await prisma_1.prisma.waitlist.findUnique({ where: { id } });
        return w ? w : null;
    }
    async findByTenant(tenantId) {
        const ws = await prisma_1.prisma.waitlist.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
        return ws;
    }
    async create(data) {
        const w = await prisma_1.prisma.waitlist.create({ data });
        return w;
    }
    async delete(id) {
        await prisma_1.prisma.waitlist.delete({ where: { id } });
    }
}
exports.PrismaWaitlistRepository = PrismaWaitlistRepository;
class PrismaConfigRepository {
    async findByKeyAndTenant(key, tenantId) {
        const c = await prisma_1.prisma.config.findUnique({
            where: {
                key_tenantId: { key, tenantId }
            }
        });
        return c ? c : null;
    }
    async findByTenant(tenantId) {
        const cs = await prisma_1.prisma.config.findMany({ where: { tenantId } });
        return cs;
    }
    async save(tenantId, key, value) {
        const c = await prisma_1.prisma.config.upsert({
            where: { key_tenantId: { key, tenantId } },
            update: { value },
            create: { key, value, tenantId }
        });
        return c;
    }
}
exports.PrismaConfigRepository = PrismaConfigRepository;
class PrismaAuditLogRepository {
    async create(data) {
        const a = await prisma_1.prisma.auditLog.create({ data });
        return a;
    }
    async findByTenant(tenantId) {
        const as = await prisma_1.prisma.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
        return as;
    }
}
exports.PrismaAuditLogRepository = PrismaAuditLogRepository;
class PrismaMenuItemRepository {
    async findById(id) {
        const m = await prisma_1.prisma.menuItem.findUnique({ where: { id } });
        return m ? m : null;
    }
    async findByTenant(tenantId) {
        const ms = await prisma_1.prisma.menuItem.findMany({ where: { tenantId }, orderBy: { category: 'asc' } });
        return ms;
    }
    async create(data) {
        const m = await prisma_1.prisma.menuItem.create({ data });
        return m;
    }
    async update(id, data) {
        const m = await prisma_1.prisma.menuItem.update({ where: { id }, data });
        return m;
    }
    async delete(id) {
        await prisma_1.prisma.menuItem.delete({ where: { id } });
    }
}
exports.PrismaMenuItemRepository = PrismaMenuItemRepository;
