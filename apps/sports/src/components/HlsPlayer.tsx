import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  /** HLS `.m3u8` URL or direct MP4 URL */
  src: string;
  /** Poster / thumbnail image */
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onError?: (msg: string) => void;
}

/**
 * HlsPlayer — lightweight HLS video component.
 *
 * - Uses hls.js for HLS (`.m3u8`) streams in browsers that don't support it natively.
 * - Falls back to the native `<video>` src attribute for Safari (native HLS) or direct MP4.
 * - Shows a "Loading" overlay while hls.js buffers the first segment.
 * - Shows an error overlay with the error message on fatal errors.
 */
export default function HlsPlayer({ src, poster, autoPlay = true, className = '', onError }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    if (!video) return;

    // Clean up any previous hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setLoading(true);
    setError(null);

    const isHls = src.includes('.m3u8') || src.includes('hls') || src.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker:      true,
        lowLatencyMode:    true,
        backBufferLength:  90,
        maxBufferLength:   30,
        maxMaxBufferLength:120,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (autoPlay) video.play().catch(() => {/* autoplay blocked */});
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          const msg = `HLS error: ${data.type} — ${data.details}`;
          setError(msg);
          setLoading(false);
          onError?.(msg);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();                     // retry on network error
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();             // try media error recovery
          } else {
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS support
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (autoPlay) video.play().catch(() => {});
      }, { once: true });
      video.addEventListener('error', () => {
        const msg = 'Video playback error';
        setError(msg);
        setLoading(false);
        onError?.(msg);
      }, { once: true });
    } else {
      // Direct MP4 / non-HLS
      video.src = src;
      setLoading(false);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, autoPlay, onError]);

  return (
    <div className={`relative bg-black w-full h-full ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        controls
        muted={autoPlay}
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-red-400 text-sm text-center px-4">{error}</p>
        </div>
      )}
    </div>
  );
}
