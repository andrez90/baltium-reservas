import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { TenantController } from '../controllers/TenantController';
import { TableController } from '../controllers/TableController';
import { ReservationController } from '../controllers/ReservationController';
import { ClientController } from '../controllers/ClientController';
import { WaitlistController } from '../controllers/WaitlistController';
import { DashboardController } from '../controllers/DashboardController';
import { NotificationController } from '../controllers/NotificationController';
import { MenuController } from '../controllers/MenuController';

import { authenticateToken, requireRole, requireTenant } from '../middlewares/auth';
import { validateBody, validateQuery, authRateLimiter } from '../middlewares/common';
import { 
  loginSchema, 
  registerSchema, 
  createTenantSchema, 
  createTableSchema, 
  updateTableLayoutSchema,
  createReservationSchema, 
  updateReservationSchema,
  createClientSchema,
  createWaitlistSchema,
  createMenuItemSchema,
  updateMenuItemSchema
} from '../validators/schemas';

const router = Router();

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/register', validateBody(registerSchema), AuthController.register);
router.post('/auth/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.get('/auth/me', authenticateToken, AuthController.getMe);

// ==========================================
// TENANTS ROUTES (REST CONTEXT)
// ==========================================
router.get('/tenants', authenticateToken, requireRole(['SUPER_ADMIN']), TenantController.list);
router.post('/tenants', authenticateToken, requireRole(['SUPER_ADMIN']), validateBody(createTenantSchema), TenantController.create);
router.get('/tenants/domain/:domain', TenantController.getByDomain); // Public for Landing page
router.get('/tenants/:id', authenticateToken, TenantController.getById);
router.put('/tenants/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), TenantController.update);

// ==========================================
// TABLES ROUTES
// ==========================================
router.get('/tables', authenticateToken, requireTenant, TableController.getTables);
router.post('/tables', authenticateToken, requireTenant, requireRole(['ADMIN']), validateBody(createTableSchema), TableController.create);
router.put('/tables/layout', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), validateBody(updateTableLayoutSchema), TableController.updateLayout);
router.put('/tables/:id', authenticateToken, requireTenant, requireRole(['ADMIN']), validateBody(createTableSchema.partial()), TableController.update);
router.delete('/tables/:id', authenticateToken, requireTenant, requireRole(['ADMIN']), TableController.delete);

// ==========================================
// RESERVATIONS ROUTES
// ==========================================
router.get('/reservations', authenticateToken, requireTenant, ReservationController.getReservations);
router.post('/reservations', validateBody(createReservationSchema), ReservationController.create); // Open for public booking
router.put('/reservations/:id', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION', 'WAITER']), validateBody(updateReservationSchema), ReservationController.update);
router.delete('/reservations/:id', authenticateToken, requireTenant, requireRole(['ADMIN']), ReservationController.delete);
router.get('/reservations/ai-recommendation', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), ReservationController.getAIRecommendation);

// ==========================================
// CLIENTS CRM ROUTES
// ==========================================
router.get('/clients', authenticateToken, requireTenant, ClientController.getClients);
router.get('/clients/:id/history', authenticateToken, requireTenant, ClientController.getClientHistory);
router.put('/clients/:id', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), validateBody(createClientSchema.partial()), ClientController.update);
router.delete('/clients/:id', authenticateToken, requireTenant, requireRole(['ADMIN']), ClientController.delete);

// ==========================================
// WAITLIST ROUTES
// ==========================================
router.get('/waitlist', authenticateToken, requireTenant, WaitlistController.getWaitlist);
router.post('/waitlist', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), validateBody(createWaitlistSchema), WaitlistController.add);
router.post('/waitlist/:id/promote', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), WaitlistController.promote);
router.delete('/waitlist/:id', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), WaitlistController.delete);

// ==========================================
// DASHBOARD & ANALYTICS ROUTES
// ==========================================
router.get('/dashboard/stats', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), DashboardController.getStats);

// ==========================================
// MOCK NOTIFICATIONS SIMULATOR DRAWER (Public view for demo visualizer)
// ==========================================
router.get('/notifications/simulator', NotificationController.getSimulatorMessages);

// ==========================================
// MENU MANAGEMENT ROUTES
// ==========================================
router.get('/menu', MenuController.getMenu); // Public for public landing page
router.post('/menu', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), validateBody(createMenuItemSchema), MenuController.create);
router.put('/menu/:id', authenticateToken, requireTenant, requireRole(['ADMIN', 'RECEPTION']), validateBody(updateMenuItemSchema), MenuController.update);
router.delete('/menu/:id', authenticateToken, requireTenant, requireRole(['ADMIN']), MenuController.delete);

export default router;
