import { useEffect, useState } from 'react';
import VideoCard from '../components/VideoCard.jsx';
import { getPublishedVideos } from '../api/client.js';

export default function CatalogPage({ onSelectVideo }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPublishedVideos();
        if (!cancelled) setVideos(data);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="loading">Loading…</p>;

  if (videos.length === 0) {
    return <p className="empty">No videos available yet.</p>;
  }

  return (
    <div className="catalog-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onClick={onSelectVideo} />
      ))}
    </div>
  );
}
