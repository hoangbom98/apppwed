// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { ServiceWorkerManager } from '../serviceWorker/ServiceWorkerManager';

interface UpdateBannerProps {
  /** Extra CSS class for the outer container */
  className?: string;
}

/**
 * UpdateBanner — shows a fixed bottom banner when a new SW version is waiting.
 *
 * Listens to the `sw:update-available` CustomEvent dispatched by ServiceWorkerManager.
 * When visible, it shows a "Cập nhật ngay" button that calls skipWaiting() + reload.
 *
 * Usage (in App.tsx, after the router):
 *   import { UpdateBanner } from '@ui/pwa/update';
 *   <UpdateBanner />
 */
export const UpdateBanner: React.FC<UpdateBannerProps> = ({ className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onUpdate = () => setVisible(true);
    document.addEventListener('sw:update-available', onUpdate);
    return () => document.removeEventListener('sw:update-available', onUpdate);
  }, []);

  const applyUpdate = useCallback(() => {
    ServiceWorkerManager.getInstance().skipWaiting();
    window.location.reload();
  }, []);

  const dismiss = useCallback(() => setVisible(false), []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}
      role="alert"
      aria-live="polite"
      aria-label="Có phiên bản mới"
    >
      <div style={{
        background:    'var(--color-surface, #1e293b)',
        border:        '1px solid var(--color-border, #334155)',
        borderRadius:  16,
        padding:       '12px 14px',
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        boxShadow:     '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>🔄 Có phiên bản mới</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            Cập nhật để trải nghiệm tính năng mới nhất.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={applyUpdate}
              style={{ padding: '4px 14px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Cập nhật ngay
            </button>
            <button
              onClick={dismiss}
              style={{ padding: '4px 10px', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer' }}
            >
              Để sau
            </button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0 }}>×</button>
      </div>
    </div>
  );
};
