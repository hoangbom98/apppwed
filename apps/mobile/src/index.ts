// packages/mobile/src/index.ts
// Entry point cho Capacitor bridge.
//
// File này không được bundle vào web app — nó chỉ là entry cho
// các native hooks (plugin registration, deep links, push tokens...).
// Được import bởi Android/iOS WebView thông qua Capacitor Core.

import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// ── App lifecycle ──────────────────────────────────────────────────────────────

// Khi user bấm nút back trên Android — không thoát ngay, để router xử lý
App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    App.exitApp();
  }
});

// Deep link handler — ví dụ: lkvip://admin/trade/kyc
App.addListener('appUrlOpen', (event) => {
  const slug = event.url.split('lkvip.admin').pop();
  if (slug) {
    // Dùng History API để navigate trong SPA
    window.history.pushState({}, '', slug);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
});

// ── StatusBar ──────────────────────────────────────────────────────────────────
// Đặt style dark (text trắng) khớp với dark theme của admin
(async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0e17' });
  } catch {
    // StatusBar không khả dụng trên web — bỏ qua
  }
})();

// ── Splash screen ──────────────────────────────────────────────────────────────
// Ẩn splash sau khi app load xong (Vue/React sẽ dispatch 'appReady')
window.addEventListener('appReady', () => {
  SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
});

export {};
