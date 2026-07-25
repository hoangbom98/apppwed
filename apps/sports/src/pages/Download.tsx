/**
 * DownloadPage — Sports sub-project
 * ------------------------------------
 * App Store / Play Store–style download page for the SPORTS app.
 * Route: /download  (public, outside Layout — no bottom nav)
 */
import { AppDistributionPage } from '@ui';

const SPORTS_APP: Record<string, any> = {
  // ── Branding ────────────────────────────────────────────────────────
  name:        'Sports Live',
  developer:   'Sports Live Entertainment',
  tagline:     'Xem bóng đá trực tiếp - Tỷ số & Livestream',
  icon:        '/icons/app-icon.svg',
  category:    'Thể thao · Tin tức',
  inAppPurchases: false,
  primaryColor: '#16a34a',  // green — matches sports theme

  // ── Stats ────────────────────────────────────────────────────────────
  rating:       4.7,
  reviewsCount: '8.2 N',
  ageLimit:     4,
  downloads:    '200 N+',
  size:         '32 MB',
  version:      '1.2.0',
  updatedAt:    'Tháng 7 năm 2026',

  // ── Download links ───────────────────────────────────────────────────
  androidLink: 'https://yourdomain.com/downloads/sports.apk',
  iosLink:     'itms-services://?action=download-manifest&url=https://yourdomain.com/ios/sports-manifest.plist',
  qrCodeUrl:   '',

  // ── Feature badges ───────────────────────────────────────────────────
  features: [
    'Tỷ số trực tiếp 24/7',
    'Livestream HD miễn phí',
    '400+ giải đấu thế giới',
    'Thông báo khi có bàn thắng',
    'Highlights & phân tích',
    'Tin tức bóng đá mới nhất',
    'Bảng xếp hạng cập nhật',
    'Cộng đồng fans năng động',
  ],

  // ── Screenshots ──────────────────────────────────────────────────────
  screenshots: [
    { url: '/images/screenshots/screen1.png', alt: 'Trang chủ Sports Live' },
    { url: '/images/screenshots/screen2.png', alt: 'Tỷ số trực tiếp' },
    { url: '/images/screenshots/screen3.png', alt: 'Livestream' },
    { url: '/images/screenshots/screen4.png', alt: 'Highlights' },
    { url: '/images/screenshots/screen5.png', alt: 'Lịch đấu' },
  ],

  // ── Description ──────────────────────────────────────────────────────
  description: `Sports Live là ứng dụng xem bóng đá hàng đầu Việt Nam — tỷ số trực tiếp, livestream HD và tin tức thể thao mới nhất mọi lúc mọi nơi.

Tính năng nổi bật:
• Tỷ số trực tiếp 400+ giải đấu: Premier League, La Liga, Bundesliga, V.League
• Livestream miễn phí chất lượng cao — không quảng cáo
• Highlights chuyên nghiệp cập nhật ngay sau trận
• Lịch thi đấu & nhắc nhở thông minh

Thống kê & Phân tích:
• Bảng xếp hạng, chỉ số cầu thủ, form đội
• Bình luận & dự đoán kết quả
• Lịch sử đối đầu head-to-head

Cộng đồng:
• Kết nối với triệu fans bóng đá Việt Nam
• Đặt cược dự đoán kết quả — nhận xu thưởng
• Video ngắn & chia sẻ khoảnh khắc đỉnh cao`,

  // ── Reviews ──────────────────────────────────────────────────────────
  reviews: [
    { author: 'Minh Tuấn', rating: 5, date: 'Tháng 7, 2026',
      body: 'App tốt nhất để xem live bóng đá. Tỷ số cập nhật siêu nhanh!' },
    { author: 'Thùy Linh', rating: 5, date: 'Tháng 6, 2026',
      body: 'Livestream mượt, không lag. Cộng đồng vui nhộn. Thích lắm!' },
    { author: 'Hữu Phong', rating: 4, date: 'Tháng 6, 2026',
      body: 'Highlights rất hay, cập nhật ngay sau trận. Giao diện đẹp, dễ dùng.' },
  ],
};

export default function DownloadPage() {
  return <AppDistributionPage appData={SPORTS_APP} />;
}
