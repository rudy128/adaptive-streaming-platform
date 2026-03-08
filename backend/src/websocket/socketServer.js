import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  addViewer,
  removeViewer,
  refreshHeartbeat,
  cleanupStaleViewers,
} from '../services/presenceService.js';
import { recordView } from '../services/analyticsService.js';
import { createView, endView } from '../db/repositories/viewRepository.js';
import { getAnalyticsSnapshot } from '../services/analyticsService.js';
import { recordSnapshot, purgeOldHistory } from '../db/repositories/concurrentHistoryRepository.js';
import env from '../config/env.js';

/** @type {Set<import('ws').WebSocket>} Admin dashboard connections */
const adminClients = new Set();

/**
 * Attach WebSocket server to an existing HTTP server.
 * @param {import('http').Server} server
 */
export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const role = url.searchParams.get('role'); // "admin" | "viewer"

    if (role === 'admin') {
      handleAdminConnection(ws);
    } else {
      handleViewerConnection(ws);
    }
  });

  // Periodic presence cleanup + admin broadcast + history recording
  setInterval(async () => {
    const removed = await cleanupStaleViewers();
    if (removed > 0) console.log(`[Presence] Cleaned up ${removed} stale viewers`);
    await broadcastAnalytics();
  }, env.heartbeatInterval);

  // Record concurrent viewer snapshot every 10s for the graph
  setInterval(async () => {
    try {
      const snapshot = await getAnalyticsSnapshot();
      await recordSnapshot({
        activeUsers: snapshot.activeUsers,
        perVideo: snapshot.videos.map((v) => ({
          videoId: v.videoId,
          viewers: v.concurrentViewers,
        })),
      });
    } catch (err) {
      console.error('[History] Failed to record snapshot:', err.message);
    }
  }, 10_000);

  // Purge old history once per hour
  setInterval(() => {
    purgeOldHistory(24).catch(() => {});
  }, 3600_000);

  console.log('[WS] WebSocket server initialized on /ws');
}

// ── Admin connections ─────────────────────────────────────────

function handleAdminConnection(ws) {
  adminClients.add(ws);
  console.log('[WS] Admin connected');

  // Send initial snapshot immediately
  sendAnalyticsToClient(ws);

  ws.on('close', () => {
    adminClients.delete(ws);
    console.log('[WS] Admin disconnected');
  });

  ws.on('error', (err) => {
    console.error('[WS] Admin error:', err.message);
    adminClients.delete(ws);
  });
}

async function sendAnalyticsToClient(ws) {
  try {
    const snapshot = await getAnalyticsSnapshot();
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'analytics_update', data: snapshot }));
    }
  } catch (err) {
    console.error('[WS] Failed to send analytics:', err.message);
  }
}

async function broadcastAnalytics() {
  if (adminClients.size === 0) return;

  try {
    const snapshot = await getAnalyticsSnapshot();
    const payload = JSON.stringify({ type: 'analytics_update', data: snapshot });

    for (const client of adminClients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  } catch (err) {
    console.error('[WS] Broadcast error:', err.message);
  }
}

// ── Viewer connections ────────────────────────────────────────

function handleViewerConnection(ws) {
  const sessionId = uuidv4();
  let currentVideoId = null;

  console.log(`[WS] Viewer connected — session ${sessionId}`);

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'play': {
          const { videoId } = msg;
          if (!videoId) break;

          // Remove from previous video if switching
          if (currentVideoId && currentVideoId !== videoId) {
            await removeViewer(currentVideoId, sessionId);
            await endView(sessionId);
          }

          currentVideoId = videoId;
          await addViewer(videoId, sessionId);
          await recordView(videoId);
          await createView({ videoId, sessionId });
          break;
        }

        case 'heartbeat': {
          await refreshHeartbeat(sessionId);
          break;
        }

        case 'pause':
        case 'stop': {
          if (currentVideoId) {
            await removeViewer(currentVideoId, sessionId);
            await endView(sessionId);
            currentVideoId = null;
          }
          break;
        }

        default:
          console.warn(`[WS] Unknown message type: ${msg.type}`);
      }
    } catch (err) {
      console.error('[WS] Message handling error:', err.message);
    }
  });

  ws.on('close', async () => {
    if (currentVideoId) {
      await removeViewer(currentVideoId, sessionId).catch(() => {});
      await endView(sessionId).catch(() => {});
    }
    console.log(`[WS] Viewer disconnected — session ${sessionId}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Viewer error (${sessionId}):`, err.message);
  });

  // Send session ID to client
  ws.send(JSON.stringify({ type: 'session', sessionId }));
}
