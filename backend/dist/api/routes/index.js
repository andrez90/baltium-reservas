"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const TenantController_1 = require("../controllers/TenantController");
const TableController_1 = require("../controllers/TableController");
const ReservationController_1 = require("../controllers/ReservationController");
const ClientController_1 = require("../controllers/ClientController");
const WaitlistController_1 = require("../controllers/WaitlistController");
const DashboardController_1 = require("../controllers/DashboardController");
const NotificationController_1 = require("../controllers/NotificationController");
const MenuController_1 = require("../controllers/MenuController");
const auth_1 = require("../middlewares/auth");
const common_1 = require("../middlewares/common");
const schemas_1 = require("../validators/schemas");
const router = (0, express_1.Router)();
// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/register', (0, common_1.validateBody)(schemas_1.registerSchema), AuthController_1.AuthController.register);
router.post('/auth/login', common_1.authRateLimiter, (0, common_1.validateBody)(schemas_1.loginSchema), AuthController_1.AuthController.login);
router.post('/auth/refresh', AuthController_1.AuthController.refresh);
router.post('/auth/forgot-password', AuthController_1.AuthController.forgotPassword);
router.get('/auth/me', auth_1.authenticateToken, AuthController_1.AuthController.getMe);
// ==========================================
// TENANTS ROUTES (REST CONTEXT)
// ==========================================
router.get('/tenants', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), TenantController_1.TenantController.list);
router.post('/tenants', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), (0, common_1.validateBody)(schemas_1.createTenantSchema), TenantController_1.TenantController.create);
router.get('/tenants/domain/:domain', TenantController_1.TenantController.getByDomain); // Public for Landing page
router.get('/tenants/:id', auth_1.authenticateToken, TenantController_1.TenantController.getById);
router.put('/tenants/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), TenantController_1.TenantController.update);
// ==========================================
// TABLES ROUTES
// ==========================================
router.get('/tables', auth_1.authenticateToken, auth_1.requireTenant, TableController_1.TableController.getTables);
router.post('/tables', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN']), (0, common_1.validateBody)(schemas_1.createTableSchema), TableController_1.TableController.create);
router.put('/tables/layout', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), (0, common_1.validateBody)(schemas_1.updateTableLayoutSchema), TableController_1.TableController.updateLayout);
router.put('/tables/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN']), (0, common_1.validateBody)(schemas_1.createTableSchema.partial()), TableController_1.TableController.update);
router.delete('/tables/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN']), TableController_1.TableController.delete);
// ==========================================
// RESERVATIONS ROUTES
// ==========================================
router.get('/reservations', auth_1.authenticateToken, auth_1.requireTenant, ReservationController_1.ReservationController.getReservations);
router.post('/reservations', (0, common_1.validateBody)(schemas_1.createReservationSchema), ReservationController_1.ReservationController.create); // Open for public booking
router.put('/reservations/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION', 'WAITER']), (0, common_1.validateBody)(schemas_1.updateReservationSchema), ReservationController_1.ReservationController.update);
router.delete('/reservations/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN']), ReservationController_1.ReservationController.delete);
router.get('/reservations/ai-recommendation', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), ReservationController_1.ReservationController.getAIRecommendation);
// ==========================================
// CLIENTS CRM ROUTES
// ==========================================
router.get('/clients', auth_1.authenticateToken, auth_1.requireTenant, ClientController_1.ClientController.getClients);
router.get('/clients/:id/history', auth_1.authenticateToken, auth_1.requireTenant, ClientController_1.ClientController.getClientHistory);
router.put('/clients/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), (0, common_1.validateBody)(schemas_1.createClientSchema.partial()), ClientController_1.ClientController.update);
router.delete('/clients/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN']), ClientController_1.ClientController.delete);
// ==========================================
// WAITLIST ROUTES
// ==========================================
router.get('/waitlist', auth_1.authenticateToken, auth_1.requireTenant, WaitlistController_1.WaitlistController.getWaitlist);
router.post('/waitlist', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), (0, common_1.validateBody)(schemas_1.createWaitlistSchema), WaitlistController_1.WaitlistController.add);
router.post('/waitlist/:id/promote', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), WaitlistController_1.WaitlistController.promote);
router.delete('/waitlist/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), WaitlistController_1.WaitlistController.delete);
// ==========================================
// DASHBOARD & ANALYTICS ROUTES
// ==========================================
router.get('/dashboard/stats', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), DashboardController_1.DashboardController.getStats);
// ==========================================
// MOCK NOTIFICATIONS SIMULATOR DRAWER (Public view for demo visualizer)
// ==========================================
router.get('/notifications/simulator', NotificationController_1.NotificationController.getSimulatorMessages);
// ==========================================
// MENU MANAGEMENT ROUTES
// ==========================================
router.get('/menu', MenuController_1.MenuController.getMenu); // Public for public landing page
router.post('/menu', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), (0, common_1.validateBody)(schemas_1.createMenuItemSchema), MenuController_1.MenuController.create);
router.put('/menu/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN', 'RECEPTION']), (0, common_1.validateBody)(schemas_1.updateMenuItemSchema), MenuController_1.MenuController.update);
router.delete('/menu/:id', auth_1.authenticateToken, auth_1.requireTenant, (0, auth_1.requireRole)(['ADMIN']), MenuController_1.MenuController.delete);
exports.default = router;
