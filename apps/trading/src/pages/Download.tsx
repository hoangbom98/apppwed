/**
 * DownloadPage — Trade sub-project
 * -----------------------------------
 * App Store / Play Store–style download page for the Trade app.
 * Route: /download  (public, no DesktopLayout)
 */
import { AppDistributionPage } from '@ui';

const TRADE_APP: Record<string, any> = {
  // ── Branding ────────────────────────────────────────────────────────
  name:        'Trade Pro',
  developer:   'Trade Pro Exchange',
  tagline:     'Giao dịch chứng khoán & Crypto chuyên nghiệp',
  icon:        '/icons/app-icon.svg',
  category:    'Tài chính · Đầu tư',
  inAppPurchases: false,
  primaryColor: '#3b82f6',  // blue — matches trade theme

  // ── Stats ────────────────────────────────────────────────────────────
  rating:       4.4,
  reviewsCount: '5.6 N',
  ageLimit:     18,
  downloads:    '100 N+',
  size:         '28 MB',
  version:      '1.5.2',
  updatedAt:    'Tháng 7 năm 2026',

  // ── Download links ───────────────────────────────────────────────────
  androidLink: 'https://yourdomain.com/downloads/tradepro.apk',
  iosLink:     'itms-services://?action=download-manifest&url=https://yourdomain.com/ios/tradepro-manifest.plist',
  qrCodeUrl:   '',

  // ── Feature badges ───────────────────────────────────────────────────
  features: [
    'Biểu đồ realtime chuyên sâu',
    'Cảnh báo giá tức thì',
    'Quản lý danh mục thông minh',
    'Nạp/rút qua 20 ngân hàng VN',
    'Bảo mật 2FA & sinh trắc học',
    'Phân tích kỹ thuật nâng cao',
    'AI gợi ý giao dịch',
    'Spot & Futures trading',
  ],

  // ── Screenshots ──────────────────────────────────────────────────────
  screenshots: [
    { url: '/images/screenshots/screen1.png', alt: 'Bảng giá Trade Pro' },
    { url: '/images/screenshots/screen2.png', alt: 'Biểu đồ kỹ thuật' },
    { url: '/images/screenshots/screen3.png', alt: 'Danh mục đầu tư' },
    { url: '/images/screenshots/screen4.png', alt: 'Lệnh giao dịch' },
    { url: '/images/screenshots/screen5.png', alt: 'Ví điện tử' },
  ],

  // ── Description ──────────────────────────────────────────────────────
  description: `Trade Pro là nền tảng giao dịch chuyên nghiệp tại Việt Nam — biểu đồ realtime, phân tích kỹ thuật nâng cao và quản lý danh mục thông minh.

Công cụ giao dịch:
• Biểu đồ candlestick realtime — 50+ chỉ báo kỹ thuật
• Spot & Futures: chứng khoán VN, crypto, forex
• Đặt lệnh nhanh với Stop-Loss & Take-Profit tự động

Phân tích thị trường:
• AI phân tích xu hướng và gợi ý entry/exit
• Tin tức tài chính cập nhật mỗi 5 phút
• Báo cáo lợi nhuận/lỗ hàng ngày

Tài chính an toàn:
• Nạp/rút qua 20 ngân hàng Việt Nam
• Bảo mật 2FA + nhận diện khuôn mặt
• Mã hóa dữ liệu cấp ngân hàng`,

  // ── Reviews ──────────────────────────────────────────────────────────
  reviews: [
    { author: 'Quang Minh', rating: 5, date: 'Tháng 7, 2026',
      body: 'Biểu đồ rất mượt, phân tích kỹ thuật đủ chỉ báo. Tốt hơn nhiều app khác!' },
    { author: 'Bảo Châu', rating: 4, date: 'Tháng 6, 2026',
      body: 'Giao diện chuyên nghiệp, dễ dùng. AI gợi ý khá chuẩn xác.' },
    { author: 'Văn Hùng', rating: 4, date: 'Tháng 6, 2026',
      body: 'Nạp rút nhanh, bảo mật tốt. Đang dùng hàng ngày.' },
  ],
};

export default function DownloadPage() {
  return <AppDistributionPage appData={TRADE_APP} />;
}
