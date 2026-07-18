import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PrismaClientRepository, PrismaReservationRepository } from '../../infrastructure/repositories/PrismaRepositories';
import { logger } from '../../infrastructure/logs/logger';

const clientRepo = new PrismaClientRepository();
const reservationRepo = new PrismaReservationRepository();

export class ClientController {
  static async getClients(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    try {
      const list = await clientRepo.findByTenant(tenantId);
      return res.status(200).json({ clients: list });
    } catch (error: any) {
      logger.error(`Get clients error: ${error.message}`);
      return res.status(500).json({ error: 'Error fetching client logs' });
    }
  }

  static async getClientHistory(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
      const client = await clientRepo.findById(id);
      if (!client || client.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Aggregate history
      const allReservations = await reservationRepo.findByTenant(tenantId);
      const clientReservations = allReservations.filter(r => r.clientEmail === client.email);
      
      const visits = clientReservations.filter(r => r.status === 'COMPLETED').length;
      const noShows = clientReservations.filter(r => r.status === 'NO_SHOW').length;
      
      // Calculate estimated consumption (e.g. mock average of 35 EUR per person in visits)
      const estimatedConsumption = clientReservations
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + (r.partySize * 35), 0);

      return res.status(200).json({
        client,
        history: {
          totalReservations: clientReservations.length,
          visits,
          noShows,
          estimatedConsumption,
          list: clientReservations
        }
      });
    } catch (error: any) {
      logger.error(`Get client history error: ${error.message}`);
      return res.status(500).json({ error: 'Error compiling client analytics profile' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const updateData = req.body;

    try {
      const client = await clientRepo.findById(id);
      if (!client || client.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Client profile not found' });
      }

      const updated = await clientRepo.update(id, updateData);
      return res.status(200).json({ message: 'Client updated successfully', client: updated });
    } catch (error: any) {
      logger.error(`Update client error: ${error.message}`);
      return res.status(500).json({ error: 'Error editing client card' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
      const client = await clientRepo.findById(id);
      if (!client || client.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Client profile not found' });
      }

      await clientRepo.delete(id);
      return res.status(200).json({ message: 'Client profile deleted successfully' });
    } catch (error: any) {
      logger.error(`Delete client error: ${error.message}`);
      return res.status(500).json({ error: 'Error deleting client from database' });
    }
  }
}
