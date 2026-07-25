// @ts-nocheck
/**
 * DownloadModal.tsx — shared-ui/components
 * ------------------------------------------
 * A bottom-sheet / modal overlay that shows OS-specific download instructions.
 *
 * Three panels (chosen automatically via useDeviceOS + usePWADownload):
 *   Android   — APK download card with permissions guide + PWA install option
 *   iOS       — Safari "Add to Home Screen" step-by-step guide + OTA link
 *   Desktop   — QR code (built-in SVG or custom URL) + direct links
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <DownloadModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     appName="LKVIP Game"
 *     appIcon="/logo.svg"
 *     androidLink="https://..."
 *     iosLink="itms-services://..."
 *     primaryColor="#194C38"
 *   />
 */

import React, { useEffect } from 'react';
import { usePWADownload } from '../hooks/usePWADownload';
import { DownloadButton } from './DownloadButton';
import {
  MobileOutlined, LaptopOutlined, DownloadOutlined, ShareAltOutlined,
  FileTextOutlined, CheckOutlined, BulbOutlined, AppstoreOutlined,
} from '@ant-design/icons';

// ── QR placeholder (copied from AppDistributionPage, zero dep) ────────────────
function QRPlaceholder({ size = 160, primaryColor = '#194C38' }: { size?: number; primaryColor?: string }) {
  const cell = Math.floor(size / 10);
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0],[1,0,0,0,0,0,1,0,1,1],[1,0,1,1,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0],[1,0,1,1,1,0,1,1,0,1],[1,0,0,0,0,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,1,1],[0,0,0,0,0,0,0,0,0,1],[1,0,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,1,0,1],
  ];
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, ri) => row.map((on, ci) => on ? (
        <rect key={`${ri}-${ci}`} x={ci*cell} y={ri*cell} width={cell-1} height={cell-1} rx="1" fill="#1a1a1a" />
      ) : null))}
      <rect x={cx-18} y={cy-18} width={36} height={36} rx={6} fill="white" />
      <rect x={cx-14} y={cy-14} width={28} height={28} rx={5} fill={primaryColor} />
      <text x={cx} y={cy+6} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="Arial, sans-serif">↓</text>
    </svg>
  );
}

// ── iOS Safari Step Guide ─────────────────────────────────────────────────────
function IOSGuide({ appName, iosLink, primaryColor }: { appName: string; iosLink: string; primaryColor: string }) {
  const steps = [
    { icon: <ShareAltOutlined />, text: <>Nhấn nút <strong>Chia sẻ</strong> ở thanh dưới Safari</> },
    { icon: <FileTextOutlined />, text: <>Kéo xuống và chọn <strong>"Thêm vào Màn hình chính"</strong></> },
    { icon: <CheckOutlined />,    text: <>Nhấn <strong>Thêm</strong> ở góc trên phải</> },
  ];
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}><MobileOutlined style={{ fontSize: 48 }} /></div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 18 }}>Cài đặt trên iPhone / iPad</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Không cần App Store — cài thẳng từ Safari</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6, paddingTop: 4 }}>{s.text}</div>
            <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#166534', marginBottom: 16 }}>
        <BulbOutlined /> <strong>Mẹo:</strong> Sau khi thêm, icon {appName} sẽ xuất hiện ngay trên màn hình chính như một ứng dụng thật sự.
      </div>

      {iosLink && iosLink !== '#' && (
        <a href={iosLink} style={{ display: 'block', textAlign: 'center', fontSize: 12, color: primaryColor, fontWeight: 600, textDecoration: 'none' }}>
          Hoặc tải IPA Enterprise →
        </a>
      )}
    </div>
  );
}

// ── Android Panel ─────────────────────────────────────────────────────────────
function AndroidPanel({
  appName, androidLink, primaryColor, onPWAInstall, isPWAInstallable,
}: { appName: string; androidLink: string; primaryColor: string; onPWAInstall: () => void; isPWAInstallable: boolean }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}><MobileOutlined style={{ fontSize: 48 }} /></div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 18 }}>Tải {appName} cho Android</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Chọn cách cài đặt phù hợp với bạn</p>
      </div>

      {/* PWA Install — preferred option */}
      {isPWAInstallable && (
        <button onClick={onPWAInstall} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
          background: primaryColor, color: '#fff', border: 'none', borderRadius: 14,
          cursor: 'pointer', marginBottom: 10, textAlign: 'left',
        }}>
          <MobileOutlined style={{ fontSize: 28, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Cài đặt nhanh (Khuyến nghị)</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Thêm vào màn hình chính · Không cần APK · Cập nhật tự động</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 18, opacity: 0.8 }}>›</span>
        </button>
      )}

      {/* APK download */}
      <a href={androidLink} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: isPWAInstallable ? '#f9fafb' : primaryColor,
        color: isPWAInstallable ? '#374151' : '#fff',
        border: isPWAInstallable ? '1px solid #e5e7eb' : 'none',
        borderRadius: 14, textDecoration: 'none', marginBottom: 16,
      }}>
        <AppstoreOutlined style={{ fontSize: 28, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Tải file APK</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Cài trực tiếp · ~50 MB</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 18, opacity: 0.7 }}>›</span>
      </a>

      {/* APK install guide */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#92400e' }}>
        <strong>Cách cài APK:</strong> Cài đặt → Ứng dụng → Nguồn không xác định → Bật lên → Cài đặt file APK vừa tải.
      </div>
    </div>
  );
}

// ── Desktop Panel ─────────────────────────────────────────────────────────────
function DesktopPanel({
  appName, androidLink, iosLink, qrCodeUrl, primaryColor, onPWAInstall, isPWAInstallable,
}: {
  appName: string; androidLink: string; iosLink: string;
  qrCodeUrl?: string; primaryColor: string; onPWAInstall: () => void; isPWAInstallable: boolean;
}) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}><LaptopOutlined style={{ fontSize: 48 }} /></div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 18 }}>Tải {appName}</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Quét QR bằng điện thoại hoặc cài ngay trên máy tính</p>
      </div>

      {/* PWA Desktop install */}
      {isPWAInstallable && (
        <button onClick={onPWAInstall} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
          background: primaryColor, color: '#fff', border: 'none', borderRadius: 14,
          cursor: 'pointer', marginBottom: 16, textAlign: 'left',
        }}>
          <LaptopOutlined style={{ fontSize: 28, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Cài đặt lên Desktop (Chrome/Edge)</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Cửa sổ riêng · Không cần trình duyệt · Offline-ready</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 18, opacity: 0.8 }}>›</span>
        </button>
      )}

      {/* QR code */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 16, marginBottom: 16 }}>
        <div style={{ padding: 8, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          {qrCodeUrl
            ? <img src={qrCodeUrl} alt="QR Code" style={{ width: 160, height: 160, objectFit: 'contain' }} />
            : <QRPlaceholder size={160} primaryColor={primaryColor} />
          }
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Quét mã để tải trên điện thoại</p>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textAlign: 'center', maxWidth: 220 }}>
          Mở camera, hướng vào QR — tự nhận diện Android hoặc iOS
        </p>
      </div>

      {/* Direct links */}
      <div style={{ display: 'flex', gap: 10 }}>
        <a href={androidLink} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
          <DownloadOutlined /> Android APK
        </a>
        <a href={iosLink} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
          <MobileOutlined /> iOS
        </a>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  appName?: string;
  appIcon?: string;
  androidLink: string;
  iosLink: string;
  qrCodeUrl?: string;
  primaryColor?: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  open,
  onClose,
  appName    = 'Ứng dụng',
  appIcon,
  androidLink,
  iosLink,
  qrCodeUrl,
  primaryColor = '#194C38',
}) => {
  const { os, isPWAInstallable, triggerInstall } = usePWADownload({ androidLink, iosLink });

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handlePWAInstall = async () => {
    await triggerInstall();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(2px)' }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tải ${appName}`}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxHeight: '92vh', overflowY: 'auto',
          background: '#fff', borderRadius: '20px 20px 0 0',
          zIndex: 1001, padding: '0 0 env(safe-area-inset-bottom,16px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 16px' }}>
          {appIcon && (
            <img src={appIcon} alt={appName} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
          )}
          <span style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{appName}</span>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: '30px', textAlign: 'center', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        {/* OS-specific panel */}
        <div style={{ padding: '0 20px 24px' }}>
          {os === 'ios' && (
            <IOSGuide appName={appName} iosLink={iosLink} primaryColor={primaryColor} />
          )}
          {os === 'android' && (
            <AndroidPanel
              appName={appName} androidLink={androidLink} primaryColor={primaryColor}
              onPWAInstall={handlePWAInstall} isPWAInstallable={isPWAInstallable}
            />
          )}
          {(os === 'desktop' || os === 'unknown') && (
            <DesktopPanel
              appName={appName} androidLink={androidLink} iosLink={iosLink}
              qrCodeUrl={qrCodeUrl} primaryColor={primaryColor}
              onPWAInstall={handlePWAInstall} isPWAInstallable={isPWAInstallable}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default DownloadModal;
