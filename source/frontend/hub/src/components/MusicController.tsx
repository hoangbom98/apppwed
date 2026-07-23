/**
 * MusicController — Floating music player.
 * Music URL is loaded from useAppConfig('media').background_music_url.
 * If no URL is configured, the controller is not rendered.
 */
import { useRef } from 'react';
import { useAppConfig } from '@ui';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export default function MusicController({ isOpen, onClose }: Props) {
  const audioRef             = useRef<HTMLAudioElement>(null);
  const { data: media }      = useAppConfig('media');
  const musicUrl: string | undefined = media?.background_music_url;

  // Don't render if no URL configured or not open
  if (!isOpen || !musicUrl) return null;

  const handlePlay  = () => audioRef.current?.play();
  const handlePause = () => audioRef.current?.pause();

  return (
    <div className="hub-music-wrap" role="dialog" aria-label="Điều khiển âm nhạc">
      <div className="hub-music-box">
        <div className="hub-music-top">
          <span className="hub-music-title">🎵 Âm nhạc</span>
          <button className="hub-music-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <audio ref={audioRef} src={musicUrl} preload="none" loop className="hub-music-audio" controls />
        <div className="hub-music-btns">
          <button className="hub-music-btn hub-music-btn--play"  onClick={handlePlay}>▶ Phát</button>
          <button className="hub-music-btn hub-music-btn--pause" onClick={handlePause}>⏸ Tạm dừng</button>
          <button className="hub-music-btn" onClick={onClose}>✕ Đóng</button>
        </div>
      </div>
    </div>
  );
}
