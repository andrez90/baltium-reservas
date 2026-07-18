"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = void 0;
const PrismaRepositories_1 = require("../../infrastructure/repositories/PrismaRepositories");
const logger_1 = require("../../infrastructure/logs/logger");
const tenantRepo = new PrismaRepositories_1.PrismaTenantRepository();
class TenantController {
    static async create(req, res) {
        const { name, domain, logo, primaryColor, secondaryColor, schedule, configuration } = req.body;
        try {
            const existing = await tenantRepo.findByDomain(domain);
            if (existing) {
                return res.status(400).json({ error: 'Tenant domain already registered' });
            }
            const tenant = await tenantRepo.create({
                name,
                domain,
                logo: logo || null,
                primaryColor: primaryColor || '#0f172a',
                secondaryColor: secondaryColor || '#3b82f6',
                schedule: schedule || '[]',
                tableCount: 0,
                capacity: 0,
                configuration: configuration || '{}'
            });
            logger_1.logger.info(`Tenant created: ${name} (${domain})`);
            return res.status(201).json({ message: 'Tenant created successfully', tenant });
        }
        catch (error) {
            logger_1.logger.error(`Create tenant error: ${error.message}`);
            return res.status(500).json({ error: 'Error creating tenant' });
        }
    }
    static async getByDomain(req, res) {
        const { domain } = req.params;
        try {
            const tenant = await tenantRepo.findByDomain(domain);
            if (!tenant) {
                return res.status(404).json({ error: 'Restaurant not found for this domain' });
            }
            return res.status(200).json({ tenant });
        }
        catch (error) {
            logger_1.logger.error(`Get tenant by domain error: ${error.message}`);
            return res.status(500).json({ error: 'Error fetching tenant details' });
        }
    }
    static async getById(req, res) {
        const { id } = req.params;
        try {
            const tenant = await tenantRepo.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            return res.status(200).json({ tenant });
        }
        catch (error) {
            logger_1.logger.error(`Get tenant by ID error: ${error.message}`);
            return res.status(500).json({ error: 'Error fetching tenant' });
        }
    }
    static async update(req, res) {
        const { id } = req.params;
        const updateData = req.body;
        // Standard tenant verification
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.tenantId !== id) {
            return res.status(403).json({ error: 'Forbidden: Cannot edit details of another restaurant' });
        }
        try {
            const updated = await tenantRepo.update(id, updateData);
            logger_1.logger.info(`Tenant ${id} updated details`);
            return res.status(200).json({ message: 'Tenant updated successfully', tenant: updated });
        }
        catch (error) {
            logger_1.logger.error(`Update tenant error: ${error.message}`);
            return res.status(500).json({ error: 'Error updating tenant details' });
        }
    }
    static async list(req, res) {
        try {
            const tenants = await tenantRepo.findAll();
            return res.status(200).json({ tenants });
        }
        catch (error) {
            logger_1.logger.error(`List tenants error: ${error.message}`);
            return res.status(500).json({ error: 'Error listing tenants' });
        }
    }
}
exports.TenantController = TenantController;
