import VideoPlayer from '../components/VideoPlayer.jsx';
import { useViewerSocket } from '../hooks/useViewerSocket.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function WatchPage({ video, onBack }) {
  const { play, pause, stop } = useViewerSocket();

  const streamUrl = `${API_BASE}/stream/${video.id}/master.m3u8`;

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
      <button className="back-btn" onClick={onBack}>
        ← Back to Catalog
      </button>

      <h2>{video.title}</h2>
      {video.description && <p className="video-description">{video.description}</p>}

      <VideoPlayer
        src={streamUrl}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </div>
  );
}
