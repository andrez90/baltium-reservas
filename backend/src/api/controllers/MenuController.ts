import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PrismaMenuItemRepository } from '../../infrastructure/repositories/PrismaRepositories';
import { logger } from '../../infrastructure/logs/logger';

const menuRepo = new PrismaMenuItemRepository();

export class MenuController {
  static async getMenu(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string || req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    try {
      const menu = await menuRepo.findByTenant(tenantId);
      return res.status(200).json({ menu });
    } catch (error: any) {
      logger.error(`Get menu error: ${error.message}`);
      return res.status(500).json({ error: 'Error fetching menu items' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    const { name, description, price, category, imageUrl, available } = req.body;

    try {
      const item = await menuRepo.create({
        name,
        description: description || null,
        price: Number(price),
        category,
        imageUrl: imageUrl || null,
        available: available !== undefined ? available : true,
        tenantId
      });

      logger.info(`Menu item created: "${name}" for tenant ${tenantId}`);
      return res.status(201).json({ message: 'Menu item created successfully', menuItem: item });
    } catch (error: any) {
      logger.error(`Create menu item error: ${error.message}`);
      return res.status(500).json({ error: 'Error creating menu item' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
      const item = await menuRepo.findById(id);
      if (!item || item.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      const updated = await menuRepo.update(id, req.body);
      logger.info(`Menu item ${id} updated for tenant ${tenantId}`);
      return res.status(200).json({ message: 'Menu item updated successfully', menuItem: updated });
    } catch (error: any) {
      logger.error(`Update menu item error: ${error.message}`);
      return res.status(500).json({ error: 'Error updating menu item' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
      const item = await menuRepo.findById(id);
      if (!item || item.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      await menuRepo.delete(id);
      logger.info(`Menu item ${id} deleted for tenant ${tenantId}`);
      return res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error: any) {
      logger.error(`Delete menu item error: ${error.message}`);
      return res.status(500).json({ error: 'Error deleting menu item' });
    }
  }
}
