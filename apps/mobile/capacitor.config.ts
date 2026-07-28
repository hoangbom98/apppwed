// packages/mobile/capacitor.config.ts
// Capacitor configuration cho LKVIP Admin mobile app.
//
// webDir trỏ đến bản build của admin-dashboard.
// Khi phát hành production, chạy `pnpm run build` từ packages/mobile
// để build web trước, rồi cap sync sẽ copy vào ios/ và android/.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lkvip.admin',
  appName: 'LKVIP Admin',

  // Trỏ đến thư mục dist của admin-dashboard (build output)
  webDir: '../admin-dashboard/dist',

  // Tắt bundled webruntime để dùng WebView gốc của thiết bị (nhỏ hơn)
  bundledWebRuntime: false,

  server: {
    // Dùng HTTPS scheme trên Android để tránh lỗi mixed-content
    androidScheme: 'https',

    // ── Development livereload ──────────────────────────────────────────────
    // Bỏ comment dòng dưới khi dev để trỏ thẳng vào Vite dev server.
    // Nhớ comment lại trước khi build production.
    // url: 'http://192.168.1.x:5180',
    // cleartext: true,  // Cần cho HTTP trong dev trên Android
  },

  plugins: {
    // ── Splash Screen ──────────────────────────────────────────────────────
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0e17',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#2563eb',
    },

    // ── Status Bar ────────────────────────────────────────────────────────
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0e17',
    },

    // ── Keyboard ──────────────────────────────────────────────────────────
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },

    // ── Push Notifications (cần @capacitor/push-notifications) ───────────
    // PushNotifications: {
    //   presentationOptions: ['badge', 'sound', 'alert'],
    // },

    // ── Local Notifications ───────────────────────────────────────────────
    // LocalNotifications: {
    //   smallIcon: 'ic_stat_icon_config_sample',
    //   iconColor: '#2563eb',
    //   sound: 'beep.wav',
    // },
  },
};

export default config;
