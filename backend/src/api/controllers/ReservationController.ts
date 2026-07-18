import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { 
  PrismaReservationRepository, 
  PrismaTableRepository, 
  PrismaClientRepository, 
  PrismaTenantRepository,
  PrismaWaitlistRepository
} from '../../infrastructure/repositories/PrismaRepositories';
import { AISeatOptimizer } from '../../application/services/aiSeatOptimizer';
import { 
  sendEmailNotification, 
  sendWhatsAppNotification, 
  sendSMSNotification 
} from '../../infrastructure/services/notification';
import { logger } from '../../infrastructure/logs/logger';
import { ReservationStatus, CelebrationType } from '../../domain/entities';

const reservationRepo = new PrismaReservationRepository();
const tableRepo = new PrismaTableRepository();
const clientRepo = new PrismaClientRepository();
const tenantRepo = new PrismaTenantRepository();
const waitlistRepo = new PrismaWaitlistRepository();

export class ReservationController {
  static async getReservations(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.role === 'SUPER_ADMIN' 
      ? (req.query.tenantId as string) 
      : req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const { date, status } = req.query;

    try {
      const list = await reservationRepo.findByTenant(tenantId, {
        date: date as string,
        status: status as string
      });
      return res.status(200).json({ reservations: list });
    } catch (error: any) {
      logger.error(`Get reservations error: ${error.message}`);
      return res.status(500).json({ error: 'Error listing reservations' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    // Both authenticated admin users AND public landing booking forms use this.
    // So if req.user is missing, we must look at tenantId in body or header.
    const tenantId = req.user?.tenantId || req.body.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is missing' });
    }

    const { clientName, clientPhone, clientEmail, dateTime, partySize, zone, celebration, notes, tableId, tablePurchased, purchaseAmount, purchasePaymentMethod } = req.body;
    const parsedDate = new Date(dateTime);

    try {
      const tenant = await tenantRepo.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Restaurant tenant not found' });
      }

      // 1. Create or retrieve client in CRM
      let client = await clientRepo.findByEmailAndTenant(clientEmail, tenantId);
      if (!client) {
        client = await clientRepo.create({
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
          tags: JSON.stringify(['Nuevo']),
          isVip: false,
          tenantId
        });
      } else {
        // Tag as VIP or Frecuente based on reservations count
        const existingRes = await reservationRepo.findByTenant(tenantId);
        const clientResCount = existingRes.filter(r => r.clientEmail === clientEmail).length;
        let tags = ['Frecuente'];
        if (client.isVip) tags.push('VIP');
        if (clientResCount > 5) {
          await clientRepo.update(client.id, { tags: JSON.stringify(tags) });
        }
      }

      // 2. Resolve Table Allocation
      let assignedTableId: string | null = tableId || null;
      let aiExplanation = '';
      
      const allTables = await tableRepo.findByTenant(tenantId);
      const activeRes = await reservationRepo.findByTenant(tenantId, {
        date: parsedDate.toISOString().split('T')[0]
      });

      if (!assignedTableId) {
        // Use AI Seat Suggestion Engine
        const suggestion = AISeatOptimizer.suggestBestSeating(
          partySize,
          zone || 'MAIN',
          allTables,
          activeRes
        );

        if (suggestion) {
          assignedTableId = suggestion.recommendedTableIds[0];
          aiExplanation = suggestion.explanation;
        } else {
          // Put on waitlist or return capacity overflow
          const waitlistObj = await waitlistRepo.create({
            clientName,
            clientPhone,
            clientEmail,
            partySize,
            zone: zone || 'MAIN',
            notes: notes || 'Auto-allocated to waitlist (No tables available)',
            tenantId
          });

          // Trigger notifications for waitlist
          await sendEmailNotification(
            clientEmail,
            `Lista de Espera - ${tenant.name}`,
            `Hola ${clientName}, estás en la lista de espera para ${partySize} personas el ${parsedDate.toLocaleString()}. Te avisaremos en cuanto haya mesa disponible.`,
            `<h3>Hola ${clientName}</h3><p>Estás en nuestra lista de espera para ${partySize} personas. Le avisaremos en cuanto se libere una mesa.</p>`
          );

          // WebSockets trigger for Waitlist updates
          if ((global as any).io) {
            (global as any).io.to(tenantId).emit('waitlistUpdated', { waitlist: waitlistObj });
          }

          return res.status(202).json({
            message: 'No seats available. Added to waitlist.',
            waitlist: waitlistObj
          });
        }
      } else {
        // Explicit table verification
        const conflict = await reservationRepo.findConflicting(assignedTableId, parsedDate, 120);
        if (conflict.length > 0) {
          return res.status(409).json({ error: 'La mesa seleccionada ya está ocupada o reservada para esta fecha y hora.' });
        }
      }

      // 3. Create Reservation
      const reservation = await reservationRepo.create({
        clientName,
        clientPhone,
        clientEmail,
        dateTime: parsedDate,
        partySize,
        zone: zone || 'MAIN',
        status: 'PENDING',
        celebration: celebration as CelebrationType || 'NONE',
        notes,
        tableId: assignedTableId,
        tenantId,
        clientId: client.id,
        isWaitlist: false,
        tablePurchased: !!tablePurchased,
        purchaseAmount: purchaseAmount || null,
        purchasePaymentMethod: purchasePaymentMethod || null
      });

      // 4. Update table status to RESERVED if today
      const todayStr = new Date().toISOString().split('T')[0];
      const resDateStr = parsedDate.toISOString().split('T')[0];
      if (todayStr === resDateStr && assignedTableId) {
        await tableRepo.update(assignedTableId, { status: 'RESERVED' });
      }

      // 5. Trigger Outgoing Notifications
      await sendEmailNotification(
        clientEmail,
        `Confirmación de Reserva - ${tenant.name}`,
        `Hola ${clientName}, tu reserva para ${partySize} personas está agendada el ${parsedDate.toLocaleString()}.`,
        `<h3>Tu reserva en ${tenant.name}</h3><p>Hola ${clientName}, tu reserva para ${partySize} personas ha sido registrada el ${parsedDate.toLocaleString()}. ¡Te esperamos!</p>`
      );

      await sendWhatsAppNotification(
        clientPhone,
        `Hola ${clientName}! Confirmamos tu reserva en ${tenant.name} para ${partySize} personas el ${parsedDate.toLocaleString()}.`
      );

      await sendSMSNotification(
        clientPhone,
        `Reserva registrada en ${tenant.name} para el ${parsedDate.toLocaleString()}.`
      );

      // 6. WebSockets push updates to clients
      if ((global as any).io) {
        (global as any).io.to(tenantId).emit('reservationCreated', { reservation, aiExplanation });
        (global as any).io.to(tenantId).emit('floorPlanUpdated', { tables: await tableRepo.findByTenant(tenantId) });
      }

      return res.status(201).json({
        message: 'Reservation created successfully',
        reservation,
        aiExplanation
      });

    } catch (error: any) {
      logger.error(`Create reservation error: ${error.message}`);
      return res.status(500).json({ error: 'Error generating reservation' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const updateData = req.body;

    try {
      const reservation = await reservationRepo.findById(id);
      if (!reservation || reservation.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const originalTableId = reservation.tableId;
      const originalStatus = reservation.status;

      // Handle table reallocation checks
      if (updateData.tableId && updateData.tableId !== originalTableId) {
        const conflict = await reservationRepo.findConflicting(
          updateData.tableId,
          updateData.dateTime ? new Date(updateData.dateTime) : reservation.dateTime,
          120
        );
        // Exclude self if conflict
        const realConflict = conflict.filter(c => c.id !== id);
        if (realConflict.length > 0) {
          return res.status(409).json({ error: 'Table is occupied during this time' });
        }
      }

      const updated = await reservationRepo.update(id, updateData);

      // Sync Table Statuses based on seat actions
      if (updateData.status && updateData.status !== originalStatus) {
        const tableId = updateData.tableId || originalTableId;
        if (tableId) {
          if (updateData.status === 'COMPLETED' || updateData.status === 'CANCELLED') {
            await tableRepo.update(tableId, { status: 'CLEANING' });
          } else if (updateData.status === 'CONFIRMED') {
            await tableRepo.update(tableId, { status: 'RESERVED' });
          }
        }

        // Send cancel email/whatsapp if cancellation
        if (updateData.status === 'CANCELLED') {
          await sendEmailNotification(
            reservation.clientEmail,
            `Reserva Cancelada`,
            `Hola ${reservation.clientName}, tu reserva ha sido cancelada.`,
            `<h3>Reserva Cancelada</h3><p>Hola ${reservation.clientName}, te confirmamos que tu reserva ha sido cancelada.</p>`
          );
        }
      }

      // Sync custom table layouts when table is dragged/dropped
      if (updateData.tableId && updateData.tableId !== originalTableId) {
        if (originalTableId) {
          await tableRepo.update(originalTableId, { status: 'AVAILABLE' });
        }
        await tableRepo.update(updateData.tableId, { status: 'RESERVED' });
      }

      // Socket live push
      if ((global as any).io) {
        (global as any).io.to(tenantId).emit('reservationUpdated', { reservation: updated });
        (global as any).io.to(tenantId).emit('floorPlanUpdated', { tables: await tableRepo.findByTenant(tenantId) });
      }

      return res.status(200).json({ message: 'Reservation updated successfully', reservation: updated });

    } catch (error: any) {
      logger.error(`Update reservation error: ${error.message}`);
      return res.status(500).json({ error: 'Error editing reservation' });
    }
  }

  static async getAIRecommendation(req: AuthenticatedRequest, res: Response) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context is required' });
    }

    const { partySize, zone, dateTime } = req.query;
    if (!partySize || !dateTime) {
      return res.status(400).json({ error: 'partySize and dateTime are required parameters' });
    }

    try {
      const tables = await tableRepo.findByTenant(tenantId);
      const activeRes = await reservationRepo.findByTenant(tenantId, {
        date: (dateTime as string).split('T')[0]
      });

      const recommendation = AISeatOptimizer.suggestBestSeating(
        Number(partySize),
        (zone as string) || 'MAIN',
        tables,
        activeRes
      );

      return res.status(200).json({ recommendation });
    } catch (error: any) {
      logger.error(`AI Optimization fetch error: ${error.message}`);
      return res.status(500).json({ error: 'Error calculating seats recommendation' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    try {
      const reservation = await reservationRepo.findById(id);
      if (!reservation || reservation.tenantId !== tenantId) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      if (reservation.tableId) {
        await tableRepo.update(reservation.tableId, { status: 'AVAILABLE' });
      }

      await reservationRepo.delete(id);

      if ((global as any).io) {
        (global as any).io.to(tenantId).emit('reservationDeleted', { id });
        (global as any).io.to(tenantId).emit('floorPlanUpdated', { tables: await tableRepo.findByTenant(tenantId) });
      }

      return res.status(200).json({ message: 'Reservation deleted' });
    } catch (error: any) {
      logger.error(`Delete reservation error: ${error.message}`);
      return res.status(500).json({ error: 'Error deleting reservation' });
    }
  }
}
