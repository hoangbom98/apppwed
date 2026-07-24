/**
 * AppDistributionPage.tsx — shared-ui
 * ------------------------------------
 * Generic App Store / Play Store–style landing page for any sub-project app.
 *
 * Features:
 *  - Auto OS detection (Android APK · iOS OTA · Desktop QR)
 *  - Screenshot carousel with horizontal scroll
 *  - Expandable description
 *  - Rating bars + user reviews
 *  - Built-in QR placeholder SVG (no external dependency)
 *  - Tailwind v4 styles (no config file needed)
 *
 * Usage:
 *   import { AppDistributionPage } from '@ui';
 *   import type { AppConfig } from '@ui';
 *
 *   const myApp: AppConfig = { name: '...', ... };
 *   <AppDistributionPage appData={myApp} />
 */

import { useState } from 'react';
import { useDeviceOS } from '../hooks/useDeviceOS';
import type { DeviceOS } from '../hooks/useDeviceOS';

// ── Types ─────────────────────────────────────────────────────────────────

export interface AppScreenshot {
  url: string;
  alt?: string;
}

export interface AppReview {
  author: string;
  /** 1–5 */
  rating: number;
  date: string;
  body: string;
  avatar?: string;
}

export interface AppConfig {
  /** App name */
  name: string;
  /** Publisher / developer name */
  developer: string;
  /** App icon URL (square, will be displayed rounded) */
  icon: string;
  /** Short tagline shown below developer */
  tagline?: string;
  /** Whether the app has in-app purchases */
  inAppPurchases?: boolean;
  /** Average rating 0–5 */
  rating: number;
  /** Number of ratings formatted, e.g. "12.5 N" */
  reviewsCount: string | number;
  /** Minimum age limit */
  ageLimit: number;
  /** Download count string, e.g. "500 N+" */
  downloads: string;
  /** Category badge, e.g. "Giải trí" */
  category?: string;
  /** Android APK download URL */
  androidLink: string;
  /** iOS OTA manifest or App Store link */
  iosLink: string;
  /** QR code image URL for desktop users — leave empty to use built-in SVG */
  qrCodeUrl?: string;
  /** App screenshots */
  screenshots?: AppScreenshot[];
  /** App description (supports \n) */
  description: string;
  /** Feature badge strings */
  features?: string[];
  /** User reviews */
  reviews?: AppReview[];
  /** Version string */
  version?: string;
  /** Size string e.g. "48 MB" */
  size?: string;
  /** Last updated date string */
  updatedAt?: string;
  /** Primary brand color (CSS value) — used for buttons and accents */
  primaryColor?: string;
}

// ── Internal: download button config ──────────────────────────────────────

interface DownloadConfig {
  text: string;
  subtext: string;
  link: string;
  bg: string;
  icon: string;
}

function getDownloadConfig(os: DeviceOS, app: AppConfig): DownloadConfig {
  const primary = app.primaryColor ?? '#01875f';
  switch (os) {
    case 'ios':
      return {
        text:    'Tải xuống cho iOS',
        subtext: 'Cài đặt trực tiếp · Yêu cầu iOS 13+',
        link:    app.iosLink,
        bg:      '#0a84ff',
        icon:    '🍎',
      };
    case 'android':
      return {
        text:    'Tải APK Android',
        subtext: 'Cho phép nguồn không xác định',
        link:    app.androidLink,
        bg:      primary,
        icon:    '▶',
      };
    default:
      return {
        text:    'Quét QR để tải',
        subtext: 'Android & iOS · Dùng camera điện thoại',
        link:    '#qrcode',
        bg:      '#1f2328',
        icon:    '📱',
      };
  }
}

// ── Star rating display ────────────────────────────────────────────────────

function Stars({ rating, lg = false }: { rating: number; lg?: boolean }) {
  const sz = lg ? '18px' : '13px';
  return (
    <span style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(rating);
        const partial = !filled && i === Math.ceil(rating) && rating % 1 > 0;
        const pct = filled ? 100 : partial ? Math.round((rating % 1) * 100) : 0;
        return (
          <span
            key={i}
            style={{ position: 'relative', width: sz, height: sz, display: 'inline-block', flexShrink: 0 }}
          >
            {/* Background star */}
            <svg width={sz} height={sz} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="#e5e7eb" />
            </svg>
            {/* Filled star (clipped to percentage) */}
            {pct > 0 && (
              <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pct}%` }}>
                <svg width={sz} height={sz} viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#fbbc05" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// ── Rating bar ─────────────────────────────────────────────────────────────

function RatingBar({ star, pct }: { star: number; pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: '#6b7280', width: '8px', flexShrink: 0 }}>{star}</span>
      <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#fbbc05', borderRadius: '99px', transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

// ── Built-in QR placeholder SVG ────────────────────────────────────────────

function QRPlaceholder({ size = 140, primaryColor = '#194C38', accentColor = '#FACF20' }: {
  size?: number; primaryColor?: string; accentColor?: string;
}) {
  const cell = Math.floor(size / 10);
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,1,1],
    [1,0,1,1,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,1,1],
    [0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,1,0,1],
  ];
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, ri) =>
        row.map((on, ci) =>
          on ? (
            <rect key={`${ri}-${ci}`} x={ci * cell} y={ri * cell}
              width={cell - 1} height={cell - 1} rx="1" fill="#1a1a1a" />
          ) : null
        )
      )}
      <rect x={cx - 18} y={cy - 18} width={36} height={36} rx={6} fill="white" />
      <rect x={cx - 14} y={cy - 14} width={28} height={28} rx={5} fill={primaryColor} />
      <text x={cx} y={cy + 6} textAnchor="middle" fill={accentColor}
        fontSize="14" fontWeight="900" fontFamily="Arial, sans-serif">G</text>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface AppDistributionPageProps {
  appData: AppConfig;
}

export function AppDistributionPage({ appData: app }: AppDistributionPageProps) {
  const os = useDeviceOS();
  const dl = getDownloadConfig(os, app);
  const primary = app.primaryColor ?? '#01875f';
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const screenshots = app.screenshots ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1f2328', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sticky top bar ──────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #f3f4f6',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <img src={app.icon} alt={app.name}
          style={{ width: 32, height: 32, borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
        <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {app.name}
        </span>
        <a href={os === 'desktop' ? '#qrcode' : dl.link}
          style={{
            padding: '6px 16px', borderRadius: '99px',
            background: primary, color: 'white',
            fontSize: '12px', fontWeight: 700, textDecoration: 'none', flexShrink: 0,
          }}>
          Tải xuống
        </a>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px 80px' }}>

        {/* ── App hero ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', padding: '24px 0 20px' }}>
          <img src={app.icon} alt={`${app.name} icon`}
            style={{ width: 96, height: 96, borderRadius: '22%', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{app.name}</h1>
            <p style={{ fontSize: '13px', color: primary, fontWeight: 600, margin: '4px 0 0' }}>{app.developer}</p>
            {app.tagline && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0', lineHeight: 1.4 }}>{app.tagline}</p>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {app.category && (
                <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f3f4f6', borderRadius: '99px', color: '#374151', fontWeight: 500 }}>
                  {app.category}
                </span>
              )}
              {app.inAppPurchases && (
                <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f3f4f6', borderRadius: '99px', color: '#374151', fontWeight: 500 }}>
                  Có mua trong ứng dụng
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────── */}
        <div style={{
          display: 'flex', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6',
          padding: '12px 0', textAlign: 'center',
        }}>
          {[
            { label: 'đánh giá', value: `${app.rating} ★` },
            { label: 'lượt tải', value: app.downloads },
            { label: 'tuổi trở lên', value: `${app.ageLimit}+` },
            ...(app.size ? [{ label: 'dung lượng', value: app.size }] : []),
          ].map((s, i, arr) => (
            <div key={i} style={{ flex: 1, padding: '0 8px', borderRight: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#1f2328' }}>{s.value}</p>
              <p style={{ fontSize: '10px', color: '#9ca3af', margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── OS detection banner ───────────────────────────────────── */}
        <div style={{ padding: '14px 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Thiết bị phát hiện:</span>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px',
            background: os === 'android' ? '#dcfce7' : os === 'ios' ? '#dbeafe' : '#f3f4f6',
            color:      os === 'android' ? '#15803d' : os === 'ios' ? '#1d4ed8' : '#4b5563',
          }}>
            {os === 'android' ? '🤖 Android' : os === 'ios' ? '🍎 iOS' : os === 'desktop' ? '💻 Desktop' : '…'}
          </span>
        </div>

        {/* ── Primary download button ───────────────────────────────── */}
        <div style={{ padding: '8px 0 16px' }}>
          <a href={dl.link} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            width: '100%', padding: '14px 20px', borderRadius: '12px',
            background: dl.bg, color: 'white', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'opacity 0.15s',
          }}>
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{dl.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>{dl.text}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{dl.subtext}</div>
            </div>
          </a>

          {/* Secondary buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {os !== 'android' && (
              <a href={app.androidLink} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', border: '1px solid #e5e7eb', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, color: '#374151', textDecoration: 'none',
              }}>
                <span>▶</span> Android
              </a>
            )}
            {os !== 'ios' && (
              <a href={app.iosLink} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', border: '1px solid #e5e7eb', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, color: '#374151', textDecoration: 'none',
              }}>
                <span>🍎</span> iOS
              </a>
            )}
            <button onClick={() => copyLink(os === 'ios' ? app.iosLink : app.androidLink)}
              title="Sao chép link"
              style={{
                padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px',
                background: 'white', cursor: 'pointer', color: copied ? '#16a34a' : '#6b7280', fontSize: '13px',
              }}>
              {copied ? '✓' : '⎘'}
            </button>
          </div>
        </div>

        {/* ── Desktop QR code ───────────────────────────────────────── */}
        {os === 'desktop' && (
          <div id="qrcode" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px',
            marginBottom: '24px', textAlign: 'center',
          }}>
            <div style={{ padding: '8px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              {app.qrCodeUrl
                ? <img src={app.qrCodeUrl} alt="QR Code" style={{ width: 140, height: 140, objectFit: 'contain' }} />
                : <QRPlaceholder size={140} primaryColor={app.primaryColor ?? '#194C38'} />
              }
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, margin: '10px 0 0', color: '#1f2328' }}>
              Quét mã để tải ứng dụng
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0', maxWidth: '280px', lineHeight: 1.5 }}>
              Mở camera điện thoại, hướng vào mã QR — tự động nhận diện Android hoặc iOS.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <a href={app.androidLink} style={{ fontSize: '12px', fontWeight: 700, color: primary, textDecoration: 'none' }}>▶ Android APK</a>
              <span style={{ color: '#d1d5db' }}>·</span>
              <a href={app.iosLink} style={{ fontSize: '12px', fontWeight: 700, color: '#0a84ff', textDecoration: 'none' }}>🍎 iOS IPA</a>
            </div>
          </div>
        )}

        {/* ── Feature badges ────────────────────────────────────────── */}
        {app.features && app.features.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '24px' }}>
            {app.features.map((f, i) => (
              <span key={i} style={{
                flexShrink: 0, padding: '6px 14px',
                background: '#f3f4f6', color: '#374151',
                fontSize: '12px', fontWeight: 600, borderRadius: '99px',
              }}>
                {f}
              </span>
            ))}
          </div>
        )}

        {/* ── Screenshots ───────────────────────────────────────────── */}
        {screenshots.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px' }}>Ảnh chụp màn hình</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {screenshots.map((s, i) => (
                <img key={i} src={s.url} alt={s.alt ?? `Screenshot ${i + 1}`} loading="lazy"
                  style={{ flexShrink: 0, width: '170px', height: 'auto', borderRadius: '14px', border: '1px solid #f3f4f6', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }} />
              ))}
            </div>
          </section>
        )}

        {/* ── Description ───────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 10px' }}>Thông tin về ứng dụng này</h2>
          <div style={{ position: 'relative' }}>
            <p style={{
              fontSize: '13px', color: '#4b5563', lineHeight: 1.75, margin: 0,
              whiteSpace: 'pre-line',
              overflow: descExpanded ? 'visible' : 'hidden',
              display: '-webkit-box', WebkitLineClamp: descExpanded ? undefined : 5,
              WebkitBoxOrient: 'vertical',
            } as any}>
              {app.description}
            </p>
            {!descExpanded && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: 'linear-gradient(to top, white, transparent)' }} />
            )}
          </div>
          <button onClick={() => setDescExpanded(v => !v)}
            style={{ marginTop: '8px', fontSize: '13px', fontWeight: 700, color: '#6b7280', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {descExpanded ? 'Thu gọn ↑' : 'Xem thêm ↓'}
          </button>
        </section>

        {/* ── Ratings & Reviews ─────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px' }}>Xếp hạng và đánh giá</h2>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Big number */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1, margin: 0 }}>{app.rating}</p>
              <Stars rating={app.rating} lg />
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{app.reviewsCount}</p>
            </div>
            {/* Bars */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const votes = app.reviews?.filter(r => r.rating === star).length ?? 0;
                const total = app.reviews?.length ?? 1;
                const pct = total > 1 ? Math.round((votes / total) * 100)
                  : star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 6 : 3;
                return <RatingBar key={star} star={star} pct={pct} />;
              })}
            </div>
          </div>

          {/* Review cards */}
          {app.reviews && app.reviews.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {app.reviews.slice(0, 3).map((r, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#d1d5db',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {r.avatar
                        ? <img src={r.avatar} alt={r.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : r.author.slice(0, 1).toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{r.author}</p>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '2px 0 0' }}>{r.date}</p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── App info details ──────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px' }}>Thông tin chi tiết</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '👤', label: 'Nhà phát triển', value: app.developer },
              { icon: '🔞', label: 'Độ tuổi',        value: `${app.ageLimit}+` },
              { icon: '📥', label: 'Lượt tải',        value: app.downloads },
              ...(app.version  ? [{ icon: '🏷️', label: 'Phiên bản', value: app.version }]  : []),
              ...(app.updatedAt ? [{ icon: '📅', label: 'Cập nhật',  value: app.updatedAt }] : []),
              ...(app.size     ? [{ icon: '💾', label: 'Kích thước', value: app.size }]      : []),
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                <span style={{ width: 32, height: 32, borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {row.icon}
                </span>
                <span style={{ flex: 1, color: '#9ca3af' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: '#1f2328' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Safety notice ─────────────────────────────────────────── */}
        <div style={{
          padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '12px', fontSize: '12px', color: '#92400e', display: 'flex', gap: '10px',
          lineHeight: 1.6,
        }}>
          <span style={{ flexShrink: 0, marginTop: '2px' }}>⚠️</span>
          <p style={{ margin: 0 }}>
            <strong>Lưu ý cài đặt:</strong> Android — bật <em>"Cài đặt từ nguồn không xác định"</em> trước khi cài APK.
            iOS Enterprise — tin tưởng certificate tại <em>Cài đặt → Chung → Quản lý thiết bị</em>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AppDistributionPage;
