// @ts-nocheck
import React, { useState } from 'react';
import { useInstallPrompt } from './useInstallPrompt';

interface InstallPromptProps {
  /** App name shown in the banner */
  appName?: string;
  /** Icon shown on the banner */
  appIcon?: string;
  /** Additional CSS class for the outer container */
  className?: string;
}

/**
 * InstallPrompt — floating bottom-bar that invites users to install the PWA.
 *
 * Renders nothing when:
 *  - app is already installed
 *  - browser doesn't support install (and it's not iOS)
 *  - user dismisses the banner (localStorage flag persists for 7 days)
 *
 * Usage (in App.tsx):
 *   import { InstallPrompt } from '@ui/pwa/install';
 *   <InstallPrompt appName="Game Portal" appIcon="/icons/icon-192.png" />
 */
export const InstallPrompt: React.FC<InstallPromptProps> = ({
  appName  = 'App',
  appIcon  = '/icons/icon-192.png',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = useInstallPrompt();

  // Persist dismiss for 7 days
  const DISMISS_KEY = 'pwa_install_dismissed';
  const [dismissed, setDismissed] = useState(() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (!ts) return false;
      return Date.now() - Number(ts) < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setDismissed(true);
  };

  if (!isInstallable || isInstalled || dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}
      role="banner"
      aria-label="Cài đặt ứng dụng"
    >
      <div style={{
        background: 'var(--color-surface, #1e293b)',
        border:     '1px solid var(--color-border, #334155)',
        borderRadius: 16,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* App icon */}
        <img
          src={appIcon}
          alt={appName}
          width={44}
          height={44}
          style={{ borderRadius: 10, flexShrink: 0 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: '1.2' }}>
            Cài đặt {appName}
          </div>
          {isIOS ? (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              Nhấn  chia sẻ → "Thêm vào màn hình chính"
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              Trải nghiệm tốt hơn, không cần App Store
            </div>
          )}

          {/* Action buttons (only on non-iOS) */}
          {!isIOS && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => install()}
                style={{
                  padding: '4px 14px',
                  borderRadius: 8,
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cài đặt
              </button>
              <button
                onClick={dismiss}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Bỏ qua
              </button>
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Đóng"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
