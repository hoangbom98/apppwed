import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ─── App Identity ───────────────────────────────────────────────────────────
  appId:   'com.lkvip.game',
  appName: 'LKVIP Game',

  // ─── Web Build Output ───────────────────────────────────────────────────────
  webDir: 'dist',

  // ─── Server (Dev live-reload — comment out khi build production) ────────────
  // server: {
  //   url:             'http://192.168.1.x:5174',
  //   cleartext:        true,
  //   androidScheme:   'http',
  // },

  // ─── Android ────────────────────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath:    'keystore/game-release.jks',
      keystoreAlias:   'game',
    },
    allowMixedContent:           true,
    captureInput:                true,
    webContentsDebuggingEnabled: false,
  },

  // ─── iOS ────────────────────────────────────────────────────────────────────
  ios: {
    contentInset:    'automatic',
    scrollEnabled:   true,
    backgroundColor: '#0c0a1a',  // Dark purple — theme game
  },

  // ─── Plugins ────────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration:        2500,
      launchAutoHide:            true,
      backgroundColor:           '#0c0a1a',
      androidSplashResourceName: 'splash',
      showSpinner:               false,
    },
    StatusBar: {
      style:           'Dark',
      backgroundColor: '#0c0a1a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize:             'body',
      style:              'dark',
      resizeOnFullScreen: true,
    },
    // Prevent screen from sleeping khi đang chơi game
    KeepAwake: {
      isSupported: true,
    },
  },
};

export default config;
