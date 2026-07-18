import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load Env variables
dotenv.config();

import router from './api/routes';
import { requestLogger, globalErrorHandler, globalRateLimiter } from './api/middlewares/common';
import { logger } from './infrastructure/logs/logger';

const app = express();
const server = http.createServer(app);

// 1. Initialize WebSockets (Socket.io)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow any origin for easy demo setup, restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Expose Socket.io globally so controllers can push updates
(global as any).io = io;

io.on('connection', (socket) => {
  const tenantId = socket.handshake.query.tenantId as string;
  
  if (tenantId) {
    socket.join(tenantId);
    logger.info(`Client connected via WebSockets to Tenant room: ${tenantId} | SocketID: ${socket.id}`);
  } else {
    logger.info(`Client connected via WebSockets (No Tenant room specified) | SocketID: ${socket.id}`);
  }

  socket.on('disconnect', () => {
    logger.info(`Client disconnected | SocketID: ${socket.id}`);
  });
});

// 2. Apply Security & Helper Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // For image uploads, mock setups
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit and request loggers
app.use(globalRateLimiter);
app.use(requestLogger);

// 3. Register Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('/api', router);

// Static uploads folder mockup (for logos/branding images if uploaded)
app.use('/uploads', express.static('uploads'));

// 4. Global Error Handler
app.use(globalErrorHandler);

// 4.5. Serve Frontend Static files from dist folder
import path from 'path';
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Fallback all routing paths back to React index.html for client routers
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 5. Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`===========================================================`);
  logger.info(`  Baltium Reservas backend running in ${process.env.NODE_ENV} mode`);
  logger.info(`  Server listening on http://localhost:${PORT}`);
  logger.info(`  Socket.io real-time engine running`);
  logger.info(`===========================================================`);
});
