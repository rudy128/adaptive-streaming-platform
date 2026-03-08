import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * HLS Video Player component.
 *
 * Uses hls.js for adaptive bitrate streaming.
 * Falls back to native HLS on Safari.
 *
 * @param {{ src: string, onPlay?: () => void, onPause?: () => void, onEnded?: () => void }} props
 */
export default function VideoPlayer({ src, onPlay, onPause, onEnded }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Auto quality switching
        autoStartLoad: true,
        startLevel: -1, // auto
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed — levels:', hls.levels.length);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        console.log(`[HLS] Quality switched → ${level.height}p`);
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
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src;
    }
  }, [src]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        style={{ width: '100%', maxWidth: '960px', borderRadius: '8px', background: '#000' }}
      />
    </div>
  );
}
