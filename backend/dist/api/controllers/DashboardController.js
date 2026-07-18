"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const PrismaRepositories_1 = require("../../infrastructure/repositories/PrismaRepositories");
const logger_1 = require("../../infrastructure/logs/logger");
const reservationRepo = new PrismaRepositories_1.PrismaReservationRepository();
const tableRepo = new PrismaRepositories_1.PrismaTableRepository();
const clientRepo = new PrismaRepositories_1.PrismaClientRepository();
class DashboardController {
    static async getStats(req, res) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context is required' });
        }
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const allReservations = await reservationRepo.findByTenant(tenantId);
            const allTables = await tableRepo.findByTenant(tenantId);
            const allClients = await clientRepo.findByTenant(tenantId);
            // 1. Filter today's reservations
            const todayReservations = allReservations.filter(r => {
                const dStr = new Date(r.dateTime).toISOString().split('T')[0];
                return dStr === todayStr;
            });
            // 2. Occupancy rate calculation
            const totalTables = allTables.length;
            const occupiedOrReservedTables = allTables.filter(t => t.status === 'OCCUPIED' || t.status === 'RESERVED').length;
            const occupancyRate = totalTables > 0 ? Math.round((occupiedOrReservedTables / totalTables) * 100) : 0;
            // 3. New clients count (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const newClients = allClients.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
            // 4. Frequent/VIP clients
            const frequentClients = allClients.filter(c => {
                try {
                    const tags = JSON.parse(c.tags || '[]');
                    return tags.includes('VIP') || tags.includes('Frecuente');
                }
                catch {
                    return c.isVip;
                }
            }).length;
            // 5. Estimated Revenue
            // We calculate a base estimate of €35 per person for CONFIRMED/COMPLETED bookings today.
            const activeBookingsToday = todayReservations.filter(r => r.status === 'CONFIRMED' || r.status === 'COMPLETED');
            const expectedRevenue = activeBookingsToday.reduce((sum, r) => sum + (r.partySize * 35), 0);
            // 6. Cancellations & No-Shows count
            const cancellations = allReservations.filter(r => r.status === 'CANCELLED').length;
            const noShows = allReservations.filter(r => r.status === 'NO_SHOW').length;
            // 7. Peak Hour trends
            const hourCounts = {};
            allReservations.forEach(r => {
                const hour = new Date(r.dateTime).getHours();
                const label = `${hour}:00`;
                hourCounts[label] = (hourCounts[label] || 0) + 1;
            });
            const peakHours = Object.keys(hourCounts)
                .map(h => ({ hour: h, count: hourCounts[h] }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            // 8. Top Clients based on total seats booked historically
            const clientBookings = {};
            allReservations.forEach(r => {
                if (!clientBookings[r.clientEmail]) {
                    clientBookings[r.clientEmail] = { name: r.clientName, count: 0, phone: r.clientPhone };
                }
                clientBookings[r.clientEmail].count += 1;
            });
            const topClients = Object.keys(clientBookings)
                .map(email => ({
                email,
                name: clientBookings[email].name,
                phone: clientBookings[email].phone,
                bookingsCount: clientBookings[email].count
            }))
                .sort((a, b) => b.bookingsCount - a.bookingsCount)
                .slice(0, 5);
            return res.status(200).json({
                todayReservationsCount: todayReservations.length,
                occupancyRate,
                newClientsCount: newClients,
                frequentClientsCount: frequentClients,
                expectedRevenueToday: expectedRevenue,
                analytics: {
                    cancellations,
                    noShows,
                    peakHours,
                    topClients,
                    occupancyTrend: [
                        { day: 'Lun', rate: 45 },
                        { day: 'Mar', rate: 52 },
                        { day: 'Mie', rate: 60 },
                        { day: 'Jue', rate: 68 },
                        { day: 'Vie', rate: 85 },
                        { day: 'Sab', rate: 92 },
                        { day: 'Dom', rate: 70 }
                    ]
                }
            });
        }
        catch (error) {
            logger_1.logger.error(`Dashboard stats error: ${error.message}`);
            return res.status(500).json({ error: 'Error generating dashboard statistics' });
        }
    }
}
exports.DashboardController = DashboardController;
