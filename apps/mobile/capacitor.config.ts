// apps/mobile/capacitor.config.ts
// Capacitor configuration cho LKVIP Mobile — wrapper cho tất cả SPA apps.
//
// webDir trỏ đến bản build của SPA được chọn.
// Để chuyển đổi target app, set biến môi trường MOBILE_TARGET trước khi build:
//   MOBILE_TARGET=hub pnpm run build
//   MOBILE_TARGET=game pnpm run build
//   MOBILE_TARGET=admin pnpm run build  (default)
import type { CapacitorConfig } from '@capacitor/cli';

// ── Target SPA map ────────────────────────────────────────────────────────────
// Mỗi entry: MOBILE_TARGET → { appId, appName, webDir, scheme, themeColor }
const TARGETS: Record<string, {
  appId: string;
  appName: string;
  webDir: string;
  androidScheme: 'https' | 'http';
  statusBarColor: string;
}> = {
  admin: {
    appId:          'com.lkvip.admin',
    appName:        'LKVIP Admin',
    webDir:         '../admin-dashboard/dist',
    androidScheme:  'https',
    statusBarColor: '#0a0e17',
  },
  hub: {
    appId:          'com.lkvip.hub',
    appName:        'LKVIP Hub',
    webDir:         '../hub/dist',
    androidScheme:  'https',
    statusBarColor: '#0f172a',
  },
  game: {
    appId:          'com.lkvip.game',
    appName:        'LKVIP Game',
    webDir:         '../game/dist',
    androidScheme:  'https',
    statusBarColor: '#0f0f1a',
  },
  trading: {
    appId:          'com.lkvip.trading',
    appName:        'LKVIP Trade',
    webDir:         '../trading/dist',
    androidScheme:  'https',
    statusBarColor: '#061015',
  },
  dating: {
    appId:          'com.lkvip.dating',
    appName:        'LKVIP Dating',
    webDir:         '../dating/dist',
    androidScheme:  'https',
    statusBarColor: '#1a0a1a',
  },
  sports: {
    appId:          'com.lkvip.sports',
    appName:        'LKVIP Sports',
    webDir:         '../sports/dist',
    androidScheme:  'https',
    statusBarColor: '#071a0a',
  },
};

const target = process.env.MOBILE_TARGET ?? 'admin';
const cfg = TARGETS[target];
if (!cfg) {
  throw new Error(
    `Unknown MOBILE_TARGET="${target}". Valid values: ${Object.keys(TARGETS).join(', ')}`
  );
}

const config: CapacitorConfig = {
  appId:             cfg.appId,
  appName:           cfg.appName,
  webDir:            cfg.webDir,
  bundledWebRuntime: false,

  server: {
    androidScheme: cfg.androidScheme,
    // ── Development livereload ────────────────────────────────────────────────
    // Bỏ comment và set IP máy local khi cần livereload:
    // url:       'http://192.168.1.x:5173',
    // cleartext: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration:       2000,
      launchAutoHide:           true,
      backgroundColor:          cfg.statusBarColor,
      androidSplashResourceName: 'splash',
      androidScaleType:         'CENTER_CROP',
      showSpinner:              false,
      spinnerColor:             '#2563eb',
    },
    StatusBar: {
      style:           'DARK',
      backgroundColor: cfg.statusBarColor,
    },
    Keyboard: {
      resize:              'body',
      style:               'DARK',
      resizeOnFullScreen:  true,
    },
  },
};

export default config;
