import { getAllVideos } from '../db/repositories/videoRepository.js';
import {
  getAllAnalytics,
  incrementTotalViews,
  upsertAnalytics,
} from '../db/repositories/analyticsRepository.js';
import {
  getConcurrentViewers,
  getGlobalActiveUsers,
} from './presenceService.js';

export async function recordView(videoId) {
  await incrementTotalViews(videoId);
}

export async function getAnalyticsSnapshot() {
  const videos = await getAllVideos();
  const activeUsers = await getGlobalActiveUsers();

  const videoMetrics = await Promise.all(
    videos.map(async (video) => {
      const concurrentViewers = await getConcurrentViewers(video.id);
      const analytics = await upsertAnalytics(video.id, {
        totalViews: undefined,
        concurrentViewers: Number(concurrentViewers),
      });

      return {
        videoId: video.id,
        title: video.title,
        status: video.status,
        concurrentViewers: Number(concurrentViewers),
        totalViews: analytics.total_views,
      };
    }),
  );

  return {
    activeUsers: Number(activeUsers),
    videos: videoMetrics,
  };
}
