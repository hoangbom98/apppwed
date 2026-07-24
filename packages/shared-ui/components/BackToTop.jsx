/**
 * shared-ui/components/BackToTop.jsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable "scroll to top" button.
 * Props:
 *   threshold  {number}   – scroll-Y threshold (px) before showing. Default 300
 *   label      {string}   – aria-label text. Default "Về đầu trang"
 *   className  {string}   – extra CSS classes
 */
import { useState, useEffect } from 'react';

export default function BackToTop({ threshold = 300, label = 'Về đầu trang', className = '' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <button
      onClick={scrollTop}
      aria-label={label}
      className={`back-to-top ${className}`.trim()}
    >
      ↑
    </button>
  );
}
