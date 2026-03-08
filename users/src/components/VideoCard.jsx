/**
 * Format seconds into mm:ss or h:mm:ss
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Video thumbnail card for the catalog grid.
 * Shows thumbnail with duration badge and title only.
 */
export default function VideoCard({ video, onClick }) {
  const duration = formatDuration(video.duration);

  return (
    <div className="video-card" onClick={() => onClick?.(video)} role="button" tabIndex={0}>
      <div className="video-card-thumb">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
        ) : (
          <div className="video-card-placeholder">🎬</div>
        )}
        {duration && <span className="video-duration">{duration}</span>}
      </div>
      <div className="video-card-info">
        <h3>{video.title}</h3>
      </div>
    </div>
  );
}
