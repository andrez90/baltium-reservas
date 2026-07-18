import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PrismaTableRepository, PrismaTenantRepository } from '../../infrastructure/repositories/PrismaRepositories';
import { logger } from '../../infrastructure/logs/logger';
import { TableStatus } from '../../domain/entities';

const tableRepo = new PrismaTableRepository();
const tenantRepo = new PrismaTenantRepository();

export class TableController {
  static async getTables(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.role === 'SUPER_ADMIN' 
      ? (req.query.tenantId as string) 
      : req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    try {
      const tables = await tableRepo.findByTenant(tenantId);
      return res.status(200).json({ tables });
    } catch (error: any) {
      logger.error(`Get tables error: ${error.message}`);
      return res.status(500).json({ error: 'Error fetching tables list' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    const { name, capacity, status, x, y, width, height, shape, zone } = req.body;

    try {
      const newTable = await tableRepo.create({
        name,
        capacity,
        status: (status as TableStatus) || 'AVAILABLE',
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

      logger.info(`Table created: "${name}" for tenant ${tenantId}`);
      return res.status(201).json({ message: 'Table created successfully', table: newTable });
    } catch (error: any) {
      logger.error(`Create table error: ${error.message}`);
      return res.status(500).json({ error: 'Error creating table' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
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

      logger.info(`Table ${id} updated for tenant ${tenantId}`);
      return res.status(200).json({ message: 'Table updated successfully', table: updated });
    } catch (error: any) {
      logger.error(`Update table error: ${error.message}`);
      return res.status(500).json({ error: 'Error updating table' });
    }
  }

  static async updateLayout(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    const { tables } = req.body; // Expects array of { id, x, y, width, height, status }

    try {
      const updatePromises = tables.map(async (t: any) => {
        const existing = await tableRepo.findById(t.id);
        if (existing && existing.tenantId === tenantId) {
          return tableRepo.update(t.id, {
            x: t.x,
            y: t.y,
            ...(t.width && { width: t.width }),
            ...(t.height && { height: t.height }),
            ...(t.status && { status: t.status as TableStatus })
          });
        }
      });

      await Promise.all(updatePromises);
      logger.info(`Layout updated for tenant ${tenantId}`);
      return res.status(200).json({ message: 'Layout updated successfully' });
    } catch (error: any) {
      logger.error(`Update layout error: ${error.message}`);
      return res.status(500).json({ error: 'Error updating layout configuration' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
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

      logger.info(`Table ${id} deleted for tenant ${tenantId}`);
      return res.status(200).json({ message: 'Table deleted successfully' });
    } catch (error: any) {
      logger.error(`Delete table error: ${error.message}`);
      return res.status(500).json({ error: 'Error deleting table' });
    }
  }
}
