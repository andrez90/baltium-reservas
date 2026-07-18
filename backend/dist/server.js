"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load Env variables
dotenv_1.default.config();
const routes_1 = __importDefault(require("./api/routes"));
const common_1 = require("./api/middlewares/common");
const logger_1 = require("./infrastructure/logs/logger");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// 1. Initialize WebSockets (Socket.io)
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Allow any origin for easy demo setup, restrict in production
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});
// Expose Socket.io globally so controllers can push updates
global.io = io;
io.on('connection', (socket) => {
    const tenantId = socket.handshake.query.tenantId;
    if (tenantId) {
        socket.join(tenantId);
        logger_1.logger.info(`Client connected via WebSockets to Tenant room: ${tenantId} | SocketID: ${socket.id}`);
    }
    else {
        logger_1.logger.info(`Client connected via WebSockets (No Tenant room specified) | SocketID: ${socket.id}`);
    }
    socket.on('disconnect', () => {
        logger_1.logger.info(`Client disconnected | SocketID: ${socket.id}`);
    });
});
// 2. Apply Security & Helper Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // For image uploads, mock setups
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limit and request loggers
app.use(common_1.globalRateLimiter);
app.use(common_1.requestLogger);
// 3. Register Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
app.use('/api', routes_1.default);
// Static uploads folder mockup (for logos/branding images if uploaded)
app.use('/uploads', express_1.default.static('uploads'));
// 4. Global Error Handler
app.use(common_1.globalErrorHandler);
// 4.5. Serve Frontend Static files from dist folder
const path_1 = __importDefault(require("path"));
const frontendPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendPath));
// Fallback all routing paths back to React index.html for client routers
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
// 5. Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    logger_1.logger.info(`===========================================================`);
    logger_1.logger.info(`  Baltium Reservas backend running in ${process.env.NODE_ENV} mode`);
    logger_1.logger.info(`  Server listening on http://localhost:${PORT}`);
    logger_1.logger.info(`  Socket.io real-time engine running`);
    logger_1.logger.info(`===========================================================`);
});
