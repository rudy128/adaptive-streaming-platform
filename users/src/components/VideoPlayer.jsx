import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

/**
 * HLS Video Player component.
 *
 * Uses hls.js for adaptive bitrate streaming.
 * Falls back to native HLS on Safari.
 * Includes a manual quality selector (Auto / 1080p / 720p / 480p).
 *
 * @param {{ src: string, onPlay?: () => void, onPause?: () => void, onEnded?: () => void }} props
 */
export default function VideoPlayer({ src, onPlay, onPause, onEnded }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  /** Available quality levels reported by hls.js */
  const [levels, setLevels] = useState([]);
  /** Currently active level index (-1 = auto) */
  const [currentLevel, setCurrentLevel] = useState(-1);
  /** Height of the currently playing level (for display) */
  const [currentHeight, setCurrentHeight] = useState(null);
  /** Whether the user chose "Auto" (default) */
  const [isAuto, setIsAuto] = useState(true);
  /** Whether the quality menu is open */
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        autoStartLoad: true,
        startLevel: -1, // auto
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed — levels:', hls.levels.length);
        // Expose available levels (sorted highest → lowest)
        const sorted = hls.levels
          .map((l, i) => ({ index: i, height: l.height, width: l.width, bitrate: l.bitrate }))
          .sort((a, b) => b.height - a.height);
        setLevels(sorted);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        console.log(`[HLS] Quality switched → ${level.height}p`);
        setCurrentLevel(data.level);
        setCurrentHeight(level.height);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[HLS] Fatal network error — trying to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[HLS] Fatal media error — trying to recover');
              hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Fatal error — destroying');
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
        setLevels([]);
        setCurrentLevel(-1);
        setIsAuto(true);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari) — no manual quality control available
      video.src = src;
    }
  }, [src]);

  /** Set a specific quality level, or -1 for auto */
  const selectQuality = useCallback((levelIndex) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (levelIndex === -1) {
      // Auto: let hls.js pick
      hls.currentLevel = -1;
      setIsAuto(true);
    } else {
      hls.currentLevel = levelIndex;
      setIsAuto(false);
    }
    setMenuOpen(false);
  }, []);

  /** Label for the current quality shown on the button */
  const activeLabel = isAuto
    ? `Auto${currentHeight ? ` (${currentHeight}p)` : ''}`
    : `${currentHeight ?? '…'}p`;

  return (
    <div className="video-player-wrapper">
      <video
        ref={videoRef}
        controls
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />

      {/* ── Quality overlay on the video canvas ────── */}
      {levels.length > 1 && (
        <div className="quality-overlay">
          <button
            className="quality-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            title="Change quality"
          >
            ⚙ {activeLabel}
          </button>

          {menuOpen && (
            <ul className="quality-menu">
              <li
                className={`quality-option${isAuto ? ' active' : ''}`}
                onClick={() => selectQuality(-1)}
              >
                Auto
                {isAuto && currentHeight && (
                  <span className="quality-badge">{currentHeight}p</span>
                )}
              </li>
              {levels.map((lvl) => (
                <li
                  key={lvl.index}
                  className={`quality-option${!isAuto && currentLevel === lvl.index ? ' active' : ''}`}
                  onClick={() => selectQuality(lvl.index)}
                >
                  {lvl.height}p
                  <span className="quality-bitrate">
                    {(lvl.bitrate / 1_000_000).toFixed(1)} Mbps
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
