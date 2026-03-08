import redis from '../config/redis.js';
import env from '../config/env.js';

const VIEWER_TTL = Math.ceil(env.heartbeatTimeout / 1000);

const videoViewersKey = (videoId) => `video:${videoId}:viewers`;
const globalActiveKey = () => 'global:active_users';
const heartbeatKey = (sessionId) => `heartbeat:${sessionId}`;
const sessionVideoKey = (sessionId) => `session:${sessionId}:video`;

export async function addViewer(videoId, sessionId) {
  const pipeline = redis.pipeline();
  pipeline.sadd(videoViewersKey(videoId), sessionId);
  pipeline.sadd(globalActiveKey(), sessionId);
  pipeline.set(heartbeatKey(sessionId), videoId, 'EX', VIEWER_TTL);
  pipeline.set(sessionVideoKey(sessionId), videoId, 'EX', VIEWER_TTL);
  await pipeline.exec();
}

export async function refreshHeartbeat(sessionId) {
  const videoId = await redis.get(sessionVideoKey(sessionId));
  if (!videoId) return null;

  const pipeline = redis.pipeline();
  pipeline.expire(heartbeatKey(sessionId), VIEWER_TTL);
  pipeline.expire(sessionVideoKey(sessionId), VIEWER_TTL);
  await pipeline.exec();

  return videoId;
}

export async function removeViewer(videoId, sessionId) {
  const pipeline = redis.pipeline();
  pipeline.srem(videoViewersKey(videoId), sessionId);
  pipeline.srem(globalActiveKey(), sessionId);
  pipeline.del(heartbeatKey(sessionId));
  pipeline.del(sessionVideoKey(sessionId));
  await pipeline.exec();
}

export async function getConcurrentViewers(videoId) {
  return redis.scard(videoViewersKey(videoId));
}

export async function getGlobalActiveUsers() {
  return redis.scard(globalActiveKey());
}

export async function cleanupStaleViewers() {
  const allActive = await redis.smembers(globalActiveKey());
  const stale = [];

  for (const sessionId of allActive) {
    const alive = await redis.exists(heartbeatKey(sessionId));
    if (!alive) {
      stale.push(sessionId);
    }
  }

  for (const sessionId of stale) {
    const videoId = await redis.get(sessionVideoKey(sessionId));
    if (videoId) {
      await redis.srem(videoViewersKey(videoId), sessionId);
    }
    await redis.srem(globalActiveKey(), sessionId);
    await redis.del(sessionVideoKey(sessionId));
  }

  return stale.length;
}
