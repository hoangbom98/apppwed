// apps/mobile/src/index.ts
// Entry point cho Capacitor bridge.
// File này không được bundle vào web app — nó chỉ là entry cho
// các native hooks (plugin registration, deep links, push tokens...).
// Được import bởi Android/iOS WebView thông qua Capacitor Core.

import { App }                 from '@capacitor/app';
import { StatusBar, Style }    from '@capacitor/status-bar';
import { SplashScreen }        from '@capacitor/splash-screen';
import { Keyboard }            from '@capacitor/keyboard';

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
// App ID được inject từ build script (MOBILE_TARGET → capacitor.config.ts)
App.addListener('appUrlOpen', (event) => {
  const url   = new URL(event.url);
  const slug  = url.pathname + url.search;
  if (slug) {
    window.history.pushState({}, '', slug);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
});

// App resume — notify SPA để refresh data nếu cần
App.addListener('appStateChange', ({ isActive }) => {
  window.dispatchEvent(new CustomEvent('capacitorStateChange', { detail: { isActive } }));
});

// ── StatusBar ──────────────────────────────────────────────────────────────────
(async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // StatusBar không khả dụng trên web — bỏ qua
  }
})();

// ── Keyboard ───────────────────────────────────────────────────────────────────
Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
  document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
});
Keyboard.addListener('keyboardWillHide', () => {
  document.documentElement.style.setProperty('--keyboard-height', '0px');
});

// ── Splash screen ──────────────────────────────────────────────────────────────
// Ẩn splash sau khi app load xong (SPA dispatch 'appReady' khi mount xong)
window.addEventListener('appReady', () => {
  SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
});

export {};
