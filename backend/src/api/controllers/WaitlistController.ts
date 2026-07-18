import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { 
  PrismaWaitlistRepository, 
  PrismaReservationRepository, 
  PrismaTableRepository,
  PrismaClientRepository,
  PrismaTenantRepository
} from '../../infrastructure/repositories/PrismaRepositories';
import { sendEmailNotification, sendWhatsAppNotification } from '../../infrastructure/services/notification';
import { logger } from '../../infrastructure/logs/logger';

const waitlistRepo = new PrismaWaitlistRepository();
const reservationRepo = new PrismaReservationRepository();
const tableRepo = new PrismaTableRepository();
const clientRepo = new PrismaClientRepository();
const tenantRepo = new PrismaTenantRepository();

export class WaitlistController {
  static async getWaitlist(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    try {
      const waitlist = await waitlistRepo.findByTenant(tenantId);
      return res.status(200).json({ waitlist });
    } catch (error: any) {
      logger.error(`Get waitlist error: ${error.message}`);
      return res.status(500).json({ error: 'Error fetching waitlist queue' });
    }
  }

  static async add(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    const { clientName, clientPhone, clientEmail, partySize, zone, notes } = req.body;

    try {
      const tenant = await tenantRepo.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant restaurant not found' });
      }

      const item = await waitlistRepo.create({
        clientName,
        clientPhone,
        clientEmail,
        partySize,
        zone: zone || 'MAIN',
        notes,
        tenantId
      });

      // Simulated notification
      await sendEmailNotification(
        clientEmail,
        `Lista de espera - ${tenant.name}`,
        `Hola ${clientName}, has sido agregado a la lista de espera para ${partySize} personas.`,
        `<h3>Lista de espera</h3><p>Hola ${clientName}, has sido agregado a la lista de espera de ${tenant.name}. Te notificaremos en cuanto tengamos una mesa libre.</p>`
      );

      if ((global as any).io) {
        (global as any).io.to(tenantId).emit('waitlistUpdated', { waitlist: await waitlistRepo.findByTenant(tenantId) });
      }

      logger.info(`Waitlist item created for: ${clientName}`);
      return res.status(201).json({ message: 'Added to waitlist successfully', waitlist: item });
    } catch (error: any) {
      logger.error(`Create waitlist error: ${error.message}`);
      return res.status(500).json({ error: 'Error creating waitlist record' });
    }
  }

  static async promote(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { tableId } = req.body; // Target table
    const tenantId = req.user?.tenantId;

    if (!tenantId || !tableId) {
      return res.status(400).json({ error: 'tenantId and tableId are required' });
    }

    try {
      const waitlist = await waitlistRepo.findById(id);
      if (!waitlist || waitlist.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Waitlist record not found' });
      }

      const table = await tableRepo.findById(tableId);
      if (!table || table.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Selected table not found' });
      }

      // Check table availability
      const conflict = await reservationRepo.findConflicting(tableId, new Date(), 120);
      if (conflict.length > 0) {
        return res.status(409).json({ error: 'Cannot promote: selected table is occupied' });
      }

      const tenant = await tenantRepo.findById(tenantId);

      // Create client if not exists
      let client = await clientRepo.findByEmailAndTenant(waitlist.clientEmail, tenantId);
      if (!client) {
        client = await clientRepo.create({
          name: waitlist.clientName,
          phone: waitlist.clientPhone,
          email: waitlist.clientEmail,
          tags: JSON.stringify(['Nuevo']),
          isVip: false,
          tenantId
        });
      }

      // Create Confirmed Reservation
      const reservation = await reservationRepo.create({
        clientName: waitlist.clientName,
        clientPhone: waitlist.clientPhone,
        clientEmail: waitlist.clientEmail,
        dateTime: new Date(), // Seats now
        partySize: waitlist.partySize,
        zone: waitlist.zone,
        status: 'CONFIRMED',
        celebration: 'NONE',
        notes: waitlist.notes || 'Promoted from Waitlist',
        tableId,
        tenantId,
        clientId: client.id,
        isWaitlist: false
      });

      // Update table status to RESERVED
      await tableRepo.update(tableId, { status: 'RESERVED' });

      // Delete waitlist item
      await waitlistRepo.delete(id);

      // Notify customer
      await sendWhatsAppNotification(
        waitlist.clientPhone,
        `¡Buenas noticias ${waitlist.clientName}! Tu mesa ya está lista en ${tenant?.name || 'nuestro restaurante'}. Mesa: ${table.name}. Te guardamos el lugar por 15 minutos.`
      );

      await sendEmailNotification(
        waitlist.clientEmail,
        `¡Tu mesa está lista!`,
        `Hola ${waitlist.clientName}, tu mesa "${table.name}" en la zona ${table.zone} ya está disponible.`,
        `<h3>¡Mesa Lista!</h3><p>Hola ${waitlist.clientName}, tu mesa <strong>${table.name}</strong> en la zona ${table.zone} ya está lista. ¡Te esperamos!</p>`
      );

      // Socket live push
      if ((global as any).io) {
        (global as any).io.to(tenantId).emit('reservationCreated', { reservation });
        (global as any).io.to(tenantId).emit('waitlistUpdated', { waitlist: await waitlistRepo.findByTenant(tenantId) });
        (global as any).io.to(tenantId).emit('floorPlanUpdated', { tables: await tableRepo.findByTenant(tenantId) });
      }

      logger.info(`Waitlist item ${id} promoted to Reservation on table ${tableId}`);
      return res.status(200).json({ message: 'Waitlist promoted successfully', reservation });
    } catch (error: any) {
      logger.error(`Promote waitlist error: ${error.message}`);
      return res.status(500).json({ error: 'Error promoting waitlist record' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
      const waitlist = await waitlistRepo.findById(id);
      if (!waitlist || waitlist.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Waitlist record not found' });
      }

      await waitlistRepo.delete(id);

      if ((global as any).io) {
        (global as any).io.to(tenantId).emit('waitlistUpdated', { waitlist: await waitlistRepo.findByTenant(tenantId) });
      }

      logger.info(`Waitlist item ${id} deleted`);
      return res.status(200).json({ message: 'Waitlist item deleted successfully' });
    } catch (error: any) {
      logger.error(`Delete waitlist error: ${error.message}`);
      return res.status(500).json({ error: 'Error deleting waitlist item' });
    }
  }
}
