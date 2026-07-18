"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableController = void 0;
const PrismaRepositories_1 = require("../../infrastructure/repositories/PrismaRepositories");
const logger_1 = require("../../infrastructure/logs/logger");
const tableRepo = new PrismaRepositories_1.PrismaTableRepository();
const tenantRepo = new PrismaRepositories_1.PrismaTenantRepository();
class TableController {
    static async getTables(req, res) {
        const tenantId = req.user?.role === 'SUPER_ADMIN'
            ? req.query.tenantId
            : req.user?.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        try {
            const tables = await tableRepo.findByTenant(tenantId);
            return res.status(200).json({ tables });
        }
        catch (error) {
            logger_1.logger.error(`Get tables error: ${error.message}`);
            return res.status(500).json({ error: 'Error fetching tables list' });
        }
    }
    static async create(req, res) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context is required' });
        }
        const { name, capacity, status, x, y, width, height, shape, zone } = req.body;
        try {
            const newTable = await tableRepo.create({
                name,
                capacity,
                status: status || 'AVAILABLE',
                x: x || 0,
                y: y || 0,
                width: width || 80,
                height: height || 80,
                shape: shape || 'rectangular',
                zone: zone || 'MAIN',
                tenantId
            });
            // Update tenant count
            const tenant = await tenantRepo.findById(tenantId);
            if (tenant) {
                await tenantRepo.update(tenantId, {
                    tableCount: tenant.tableCount + 1,
                    capacity: tenant.capacity + capacity
                });
            }
            logger_1.logger.info(`Table created: "${name}" for tenant ${tenantId}`);
            return res.status(201).json({ message: 'Table created successfully', table: newTable });
        }
        catch (error) {
            logger_1.logger.error(`Create table error: ${error.message}`);
            return res.status(500).json({ error: 'Error creating table' });
        }
    }
    static async update(req, res) {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        const updateData = req.body;
        try {
            const table = await tableRepo.findById(id);
            if (!table || table.tenantId !== tenantId) {
                return res.status(404).json({ error: 'Table not found' });
            }
            const updated = await tableRepo.update(id, updateData);
            // Recalculate tenant capacity if updated capacity
            if (updateData.capacity && updateData.capacity !== table.capacity) {
                const tenant = await tenantRepo.findById(tenantId);
                if (tenant) {
                    await tenantRepo.update(tenantId, {
                        capacity: tenant.capacity - table.capacity + updateData.capacity
                    });
                }
            }
            logger_1.logger.info(`Table ${id} updated for tenant ${tenantId}`);
            return res.status(200).json({ message: 'Table updated successfully', table: updated });
        }
        catch (error) {
            logger_1.logger.error(`Update table error: ${error.message}`);
            return res.status(500).json({ error: 'Error updating table' });
        }
    }
    static async updateLayout(req, res) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context is required' });
        }
        const { tables } = req.body; // Expects array of { id, x, y, width, height, status }
        try {
            const updatePromises = tables.map(async (t) => {
                const existing = await tableRepo.findById(t.id);
                if (existing && existing.tenantId === tenantId) {
                    return tableRepo.update(t.id, {
                        x: t.x,
                        y: t.y,
                        ...(t.width && { width: t.width }),
                        ...(t.height && { height: t.height }),
                        ...(t.status && { status: t.status })
                    });
                }
            });
            await Promise.all(updatePromises);
            logger_1.logger.info(`Layout updated for tenant ${tenantId}`);
            return res.status(200).json({ message: 'Layout updated successfully' });
        }
        catch (error) {
            logger_1.logger.error(`Update layout error: ${error.message}`);
            return res.status(500).json({ error: 'Error updating layout configuration' });
        }
    }
    static async delete(req, res) {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        try {
            const table = await tableRepo.findById(id);
            if (!table || table.tenantId !== tenantId) {
                return res.status(404).json({ error: 'Table not found' });
            }
            await tableRepo.delete(id);
            // Decrement tenant counts
            const tenant = await tenantRepo.findById(tenantId);
            if (tenant) {
                await tenantRepo.update(tenantId, {
                    tableCount: Math.max(0, tenant.tableCount - 1),
                    capacity: Math.max(0, tenant.capacity - table.capacity)
                });
            }
            logger_1.logger.info(`Table ${id} deleted for tenant ${tenantId}`);
            return res.status(200).json({ message: 'Table deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error(`Delete table error: ${error.message}`);
            return res.status(500).json({ error: 'Error deleting table' });
        }
    }
}
exports.TableController = TableController;
