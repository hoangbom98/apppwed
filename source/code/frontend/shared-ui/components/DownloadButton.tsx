/**
 * DownloadButton.tsx — shared-ui/components
 * -------------------------------------------
 * A smart CTA button that auto-detects OS and triggers the right download flow:
 *
 *  Android + PWA installable  → native install dialog
 *  Android (no PWA prompt)    → APK direct download
 *  iOS (not installed)        → opens iosLink + shows Safari guide tooltip
 *  iOS (already installed)    → does nothing / shows "Đã cài đặt"
 *  Desktop + PWA installable  → native install dialog
 *  Desktop (no PWA prompt)    → scrolls to QR / opens androidLink
 *
 * Usage:
 *   <DownloadButton
 *     androidLink="https://example.com/app.apk"
 *     iosLink="itms-services://..."
 *     label="Tải app ngay"         // optional override
 *     size="lg"                    // 'sm' | 'md' | 'lg'
 *     primaryColor="#194C38"
 *     onSuccess={() => {}}         // called after accepted install
 *   />
 */

import React, { useState } from 'react';
import { usePWADownload } from '../hooks/usePWADownload';

export interface DownloadButtonProps {
  androidLink: string;
  iosLink: string;
  /** Override the auto-generated label */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  primaryColor?: string;
  /** Additional inline style */
  style?: React.CSSProperties;
  className?: string;
  /** Called when user accepted PWA install, tapped APK link, or opened iOS link */
  onSuccess?: () => void;
}

const SIZES = {
  sm: { padding: '6px 16px',  fontSize: '12px', borderRadius: '8px',  iconSize: '14px' },
  md: { padding: '10px 22px', fontSize: '14px', borderRadius: '10px', iconSize: '18px' },
  lg: { padding: '14px 32px', fontSize: '16px', borderRadius: '12px', iconSize: '22px' },
};

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  androidLink,
  iosLink,
  label,
  size = 'md',
  primaryColor = '#194C38',
  style = {},
  className = '',
  onSuccess,
}) => {
  const { mode, ctaLabel, ctaIcon, triggerInstall, showIOSSafariGuide, isInstalled, os } =
    usePWADownload({ androidLink, iosLink });

  const [showGuide, setShowGuide] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  const sz = SIZES[size];

  const handleClick = async () => {
    // iOS: show Safari guide instead of navigating
    if (showIOSSafariGuide) {
      setShowGuide(true);
      return;
    }
    setLoading(true);
    const ok = await triggerInstall();
    setLoading(false);
    if (ok) {
      setDone(true);
      onSuccess?.();
    }
  };

  if (isInstalled && os !== 'desktop') {
    return (
      <span style={{ ...sz, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#15803d', fontWeight: 700, borderRadius: sz.borderRadius, padding: sz.padding, fontSize: sz.fontSize, ...style }} className={className}>
        ✓ Đã cài đặt
      </span>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        disabled={loading || done}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: sz.padding,
          fontSize: sz.fontSize,
          fontWeight: 700,
          borderRadius: sz.borderRadius,
          border: 'none',
          background: done ? '#16a34a' : primaryColor,
          color: '#fff',
          cursor: loading || done ? 'default' : 'pointer',
          opacity: loading ? 0.8 : 1,
          transition: 'opacity 0.15s, background 0.2s',
          textDecoration: 'none',
          lineHeight: 1.2,
          ...style,
        }}
        className={className}
        aria-label={label ?? ctaLabel}
      >
        {loading ? (
          <span style={{ display: 'inline-block', width: sz.iconSize, height: sz.iconSize, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        ) : (
          <span style={{ fontSize: sz.iconSize, lineHeight: 1, flexShrink: 0 }}>{done ? '✓' : ctaIcon}</span>
        )}
        <span>{done ? 'Đã xử lý' : (label ?? ctaLabel)}</span>
      </button>

      {/* iOS Safari guide tooltip */}
      {showGuide && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f2328', color: '#fff',
            borderRadius: 12, padding: '12px 16px',
            fontSize: '12px', lineHeight: 1.6,
            width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            zIndex: 200, textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📱 Cài đặt trên iPhone/iPad</div>
          <ol style={{ textAlign: 'left', paddingLeft: 18, margin: 0 }}>
            <li>Nhấn nút <strong>Chia sẻ</strong> ở thanh dưới Safari</li>
            <li>Chọn <strong>"Thêm vào Màn hình chính"</strong></li>
            <li>Nhấn <strong>Thêm</strong></li>
          </ol>
          <button
            onClick={() => setShowGuide(false)}
            style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Đóng
          </button>
          {/* Caret */}
          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 6, overflow: 'hidden' }}>
            <div style={{ width: 12, height: 12, background: '#1f2328', transform: 'rotate(45deg)', margin: '-6px auto 0' }} />
          </div>
        </div>
      )}

      {/* Global keyframe for spinner */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default DownloadButton;
