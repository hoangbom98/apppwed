/**
 * DownloadPage — Hub sub-project
 * --------------------------------
 * Lists all 4 sub-project apps with smart OS-aware download buttons.
 * Download links are fetched dynamically from GET /api/hub/app-catalog (admin_db).
 * Falls back to VITE_DOWNLOAD_* env vars if the API is unavailable.
 *
 * Route: /download  (public, within MainLayout)
 */

import React, { useState } from 'react';
import { useQuery }        from '@tanstack/react-query';
import { DownloadButton, DownloadModal, useDeviceOS } from '@ui';
import { getAppCatalog }   from '../api/hub';
import { MobileOutlined, LaptopOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons';

// ── Env-var fallback helpers ──────────────────────────────────────────────────
function envUrl(fallback: string, key: string): string {
  return (import.meta as any).env?.[key] || fallback;
}

// ── Static fallback definitions (used when API unavailable) ──────────────────
interface AppCard {
  key:          string;
  name:         string;
  tagline:      string;
  color:        string;
  bg:           string;
  androidLink:  string;
  iosLink:      string;
  /** Emoji or short text shown in the card header icon box */
  icon?:        string;
  /** URL for the DownloadModal app icon image */
  appIcon?:     string;
  category:     string;
  rating:       number;
  downloads:    string;
  primaryColor: string;
}

const FALLBACK_APPS: AppCard[] = [
  {
    key: 'game',
    name:     'GAMEX',
    tagline:  'Casino & Game H5 hàng đầu Việt Nam',
    color:    '#16a34a',
    bg:       'linear-gradient(135deg,#052e16,#14532d)',
    category: 'Giải trí · 18+',
    rating:   4.6,
    downloads:'500 N+',
    primaryColor: '#194C38',
    androidLink: envUrl('https://yourdomain.com/downloads/gamex.apk',  'VITE_DOWNLOAD_GAMEX_APK'),
    iosLink:     envUrl('itms-services://?action=download-manifest&url=https://yourdomain.com/ios/gamex.plist', 'VITE_DOWNLOAD_GAMEX_IOS'),
  },
  {
    key: 'sports',
    name:     'Sports Live',
    tagline:  'Bóng đá trực tiếp & Tỷ số realtime',
    color:    '#16a34a',
    bg:       'linear-gradient(135deg,#052e16,#065f46)',
    category: 'Thể thao',
    rating:   4.7,
    downloads:'200 N+',
    primaryColor: '#16a34a',
    androidLink: envUrl('https://yourdomain.com/downloads/sports.apk',  'VITE_DOWNLOAD_SPORTS_APK'),
    iosLink:     envUrl('itms-services://?action=download-manifest&url=https://yourdomain.com/ios/sports.plist', 'VITE_DOWNLOAD_SPORTS_IOS'),
  },
  {
    key: 'dating',
    name:     'AppLive18',
    tagline:  'Hẹn hò & Live stream kết nối trái tim',
    color:    '#ec4899',
    bg:       'linear-gradient(135deg,#500724,#831843)',
    category: 'Hẹn hò · 18+',
    rating:   4.5,
    downloads:'1 Tr+',
    primaryColor: '#ec4899',
    androidLink: envUrl('https://yourdomain.com/downloads/applive18.apk',  'VITE_DOWNLOAD_DATING_APK'),
    iosLink:     envUrl('itms-services://?action=download-manifest&url=https://yourdomain.com/ios/applive18.plist', 'VITE_DOWNLOAD_DATING_IOS'),
  },
  {
    key: 'trade',
    name:     'Trade Pro',
    tagline:  'Giao dịch chứng khoán & Crypto',
    color:    '#3b82f6',
    bg:       'linear-gradient(135deg,#172554,#1e3a8a)',
    category: 'Tài chính',
    rating:   4.4,
    downloads:'100 N+',
    primaryColor: '#F0B90B',
    androidLink: envUrl('https://yourdomain.com/downloads/tradepro.apk',  'VITE_DOWNLOAD_TRADE_APK'),
    iosLink:     envUrl('itms-services://?action=download-manifest&url=https://yourdomain.com/ios/tradepro.plist', 'VITE_DOWNLOAD_TRADE_IOS'),
  },
];

// ── Merge API data into fallback cards ───────────────────────────────────────
function mergeWithApi(fallbacks: AppCard[], apiData: any[]): AppCard[] {
  return fallbacks.map(fb => {
    const remote = apiData.find((a: any) => a.appId === fb.key);
    if (!remote) return fb;
    return {
      ...fb,
      name:         remote.name        ?? fb.name,
      androidLink:  remote.androidLink ?? fb.androidLink,
      iosLink:      remote.iosLink     ?? fb.iosLink,
      primaryColor: remote.primaryColor ?? fb.primaryColor,
      rating:       parseFloat(remote.rating) || fb.rating,
      downloads:    remote.downloads   ?? fb.downloads,
      category:     remote.category    ?? fb.category,
    };
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#facc15' : '#4b5563', fontSize: 14 }}>★</span>
      ))}
      <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function OSBanner({ os }: { os: string }) {
  const map: Record<string, { label: React.ReactNode; bg: string; color: string }> = {
    android: { label: <><MobileOutlined /> Đã phát hiện: Android — nút tải sẽ lấy APK trực tiếp</>, bg: '#dcfce7', color: '#15803d' },
    ios:     { label: <><MobileOutlined /> Đã phát hiện: iPhone/iPad — nút tải sẽ hướng dẫn cài qua Safari</>, bg: '#dbeafe', color: '#1d4ed8' },
    desktop: { label: <><LaptopOutlined /> Đang dùng Desktop — quét mã QR để tải trên điện thoại</>, bg: '#f3f4f6', color: '#374151' },
  };
  const info = map[os] ?? map.desktop;
  return (
    <div style={{ padding: '10px 16px', background: info.bg, color: info.color, borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 28 }}>
      {info.label}
    </div>
  );
}

// ── Skeleton card (shown while loading) ──────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ height: 140, background: 'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ background: '#fff', padding: '16px 20px', height: 70 }}>
        <div style={{ height: 14, borderRadius: 7, background: '#e5e7eb', width: '70%', marginBottom: 8 }} />
        <div style={{ height: 12, borderRadius: 6, background: '#f3f4f6', width: '40%' }} />
      </div>
      <style>{`@keyframes shimmer { to { background-position: -200% 0 } }`}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DownloadPage() {
  const os = useDeviceOS();
  const [modalApp, setModalApp] = useState<AppCard | null>(null);

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['app-catalog'],
    queryFn:  () => getAppCatalog().then(r => r.data?.data ?? []),
    staleTime: 5 * 60 * 1000,
    retry: false,             // don't retry — silently fall back on error
  });

  const apps = isLoading ? FALLBACK_APPS : mergeWithApi(FALLBACK_APPS, catalogData ?? []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 8 }}>
          <MobileOutlined style={{ marginRight: 8 }} />Tải ứng dụng
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
          Tải ngay ứng dụng di động — trải nghiệm tốt hơn trên điện thoại của bạn
        </p>
      </div>

      {/* OS detection banner */}
      {os !== 'unknown' && <OSBanner os={os} />}

      {/* App grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        {isLoading
          ? FALLBACK_APPS.map(a => <SkeletonCard key={a.key} />)
          : apps.map(app => (
            <div key={app.key} style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>

              {/* Card header */}
              <div style={{ background: app.bg, padding: '24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    {app.icon}
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2, margin: 0 }}>{app.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, marginBottom: 0 }}>{app.category}</p>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' }}>{app.tagline}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <StarRating rating={app.rating} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}><DownloadOutlined /> {app.downloads}</span>
                </div>
              </div>

              {/* Download area */}
              <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <DownloadButton
                  androidLink={app.androidLink}
                  iosLink={app.iosLink}
                  primaryColor={app.primaryColor}
                  size="large"
                  style={{ flex: 1, justifyContent: 'center' }}
                />
                <button
                  onClick={() => setModalApp(app)}
                  title="Xem chi tiết"
                  style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6b7280', flexShrink: 0 }}
                >
                  <InfoCircleOutlined />
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* DownloadModal */}
      {modalApp && (
        <DownloadModal
          open={!!modalApp}
          onClose={() => setModalApp(null)}
          appName={modalApp.name}
          appIcon={modalApp.appIcon}
          androidLink={modalApp.androidLink}
          iosLink={modalApp.iosLink}
          primaryColor={modalApp.primaryColor}
        />
      )}

      <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: 11, marginTop: 32, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
        Made with IBM Bob
      </p>
    </div>
  );
}
