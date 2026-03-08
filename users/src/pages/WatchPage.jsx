import { useEffect, useState } from 'react';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { useViewerSocket } from '../hooks/useViewerSocket.js';
import { getPublishedVideos } from '../api/client.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function WatchPage({ video, onBack, onSelectVideo }) {
  const { play, pause, stop } = useViewerSocket();
  const [otherVideos, setOtherVideos] = useState([]);

  const streamUrl = `${API_BASE}/stream/${video.id}/master.m3u8`;

  useEffect(() => {
    getPublishedVideos()
      .then((all) => setOtherVideos(all.filter((v) => v.id !== video.id)))
      .catch(() => {});
  }, [video.id]);

  function handlePlay() {
    play(video.id);
  }

  function handlePause() {
    pause();
  }

  function handleEnded() {
    stop();
  }

  return (
    <div className="watch-page">
      {/* ── Main column ──────────────────────────── */}
      <div className="watch-main">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <div className="watch-video-container">
          <VideoPlayer
            src={streamUrl}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
          />
        </div>

        <div className="watch-info">
          <h1 className="watch-title">{video.title}</h1>
          {video.description && (
            <p className="watch-description">{video.description}</p>
          )}
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────── */}
      {otherVideos.length > 0 && (
        <aside className="watch-sidebar">
          <p className="sidebar-heading">More videos</p>
          {otherVideos.map((v) => (
            <div
              key={v.id}
              className="sidebar-card"
              onClick={() => onSelectVideo?.(v)}
              role="button"
              tabIndex={0}
            >
              <div className="sidebar-card-thumb">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} loading="lazy" />
                ) : (
                  <div className="video-card-placeholder" style={{ fontSize: '1.5rem', height: '100%' }}>🎬</div>
                )}
                {v.duration > 0 && (
                  <span className="sidebar-duration">{formatDuration(v.duration)}</span>
                )}
              </div>
              <div className="sidebar-card-info">
                <h4>{v.title}</h4>
              </div>
            </div>
          ))}
        </aside>
      )}
    </div>
  );
}
