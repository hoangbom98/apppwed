import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ─── App Identity ───────────────────────────────────────────────────────────
  appId:   'com.kjc.hub',
  appName: 'KJC Hub',

  // ─── Web Build Output (Vite → dist/) ────────────────────────────────────────
  webDir: 'dist',

  // ─── Server (Dev live-reload — comment out khi build production) ────────────
  // server: {
  //   url:             'http://192.168.1.x:5173',  // IP máy tính của bạn
  //   cleartext:        true,
  //   androidScheme:   'http',
  // },

  // ─── Android ────────────────────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath:    'keystore/hub-release.jks',
      keystoreAlias:   'hub',
    },
    // Cho phép mixed content (HTTP API calls trong WebView)
    allowMixedContent: true,
    // Bật hardware back button
    captureInput: true,
    webContentsDebuggingEnabled: false,  // true khi debug
  },

  // ─── iOS ────────────────────────────────────────────────────────────────────
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#0f172a',  // Slate-900 — khớp với theme dark
  },

  // ─── Plugins ────────────────────────────────────────────────────────────────
  plugins: {
    // Cấu hình SplashScreen
    SplashScreen: {
      launchShowDuration:  2000,
      launchAutoHide:      true,
      backgroundColor:     '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner:         false,
    },
    // Cấu hình StatusBar
    StatusBar: {
      style:           'Dark',
      backgroundColor: '#0f172a',
    },
    // Push Notifications (cần cấu hình Firebase)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Keyboard
    Keyboard: {
      resize:         'body',
      style:          'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
