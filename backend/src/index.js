import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';

import env from './config/env.js';
import uploadRoutes from './routes/upload.js';
import videoRoutes from './routes/videos.js';
import analyticsRoutes from './routes/analytics.js';
import streamRoutes from './routes/stream.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initWebSocketServer } from './websocket/socketServer.js';

const app = express();
const server = createServer(app);

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stream', streamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

initWebSocketServer(server);

server.listen(env.port, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║  Streaming Backend — ${env.nodeEnv}             
  ║  HTTP  → http://localhost:${env.port}           
  ║  WS    → ws://localhost:${env.port}/ws          
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
