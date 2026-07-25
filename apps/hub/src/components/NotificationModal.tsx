/**
 * NotificationModal — Welcome popup on first visit.
 * Slides are loaded dynamically from useAppConfig('popups').
 * Falls back to empty (no modal shown) if no popup config exists.
 * Hardcoded CDN URLs and marketing copy have been removed.
 */
import { useState } from 'react';
import { useAppConfig } from '@ui';

interface Slide {
  img:      string;
  title:    string;
  body:     string;
  link?:    string;
  linkText?: string;
}

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'hub_hideNotification';

export default function NotificationModal({ isOpen, onClose }: Props) {
  const [checked, setChecked] = useState(false);
  const [slide, setSlide]     = useState(0);
  const { data: popups }      = useAppConfig('popups') as { data: any };

  // slides come from CMS config: popups.welcome_slides (array)
  const slides: Slide[] = Array.isArray(popups?.welcome_slides)
    ? popups.welcome_slides
    : [];

  // Nothing to show → don't render
  if (!isOpen || slides.length === 0) return null;

  const handleClose = () => {
    if (checked) localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  const s = slides[Math.min(slide, slides.length - 1)];

  return (
    <div className="hub-overlay" role="dialog" aria-modal="true">
      <div className="hub-notify-popup">
        {/* Header */}
        <div className="hub-notify-header">
          <button
            className="hub-no-tips"
            onClick={() => setChecked(v => !v)}
            aria-label="Không hiển thị nữa"
          >
            <span className={`hub-checkbox ${checked ? 'hub-checkbox--checked' : ''}`}>
              {checked && <span className="hub-check-mark">✓</span>}
            </span>
            <span>Không hiển thị nữa</span>
          </button>
          <button className="hub-notify-close" onClick={handleClose} aria-label="Đóng">×</button>
        </div>

        {/* Content */}
        <div className="hub-notify-content">
          <p className="hub-notify-title">{s.title}</p>
          <img src={s.img} alt={s.title} className="hub-notify-img" loading="lazy" />
          {s.body && (
            <p className="hub-notify-body">
              {s.body}
              {s.link && (
                <> <a href={s.link} target="_blank" rel="noopener noreferrer" className="hub-notify-link">
                  <strong>{s.linkText || s.link}</strong>
                </a></>
              )}
            </p>
          )}
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="hub-notify-dots">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`hub-dot ${i === slide ? 'hub-dot--active' : ''}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
