/**
 * Video thumbnail card for the catalog grid.
 */
export default function VideoCard({ video, onClick }) {
  return (
    <div className="video-card" onClick={() => onClick?.(video)} role="button" tabIndex={0}>
      <div className="video-card-thumb">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} />
        ) : (
          <div className="video-card-placeholder">🎬</div>
        )}
      </div>
      <div className="video-card-info">
        <h3>{video.title}</h3>
        {video.description && <p>{video.description}</p>}
      </div>
    </div>
  );
}
