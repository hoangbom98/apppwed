import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ─── App Identity ───────────────────────────────────────────────────────────
  appId:   'com.kjc.dating',
  appName: 'KJC Dating',

  // ─── Web Build Output ───────────────────────────────────────────────────────
  webDir: 'dist',

  // ─── Server (Dev live-reload — comment out khi build production) ────────────
  // server: {
  //   url:             'http://192.168.1.x:5176',
  //   cleartext:        true,
  //   androidScheme:   'http',
  // },

  // ─── Android ────────────────────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath:    'keystore/dating-release.jks',
      keystoreAlias:   'dating',
    },
    allowMixedContent:           true,
    captureInput:                true,
    webContentsDebuggingEnabled: false,
  },

  // ─── iOS ────────────────────────────────────────────────────────────────────
  ios: {
    contentInset:    'automatic',
    scrollEnabled:   true,
    backgroundColor: '#0f0a1a',  // Deep purple — dating theme
  },

  // ─── Plugins ────────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration:        3000,
      launchAutoHide:            true,
      backgroundColor:           '#0f0a1a',
      androidSplashResourceName: 'splash',
      showSpinner:               false,
    },
    StatusBar: {
      style:           'Dark',
      backgroundColor: '#0f0a1a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize:             'body',
      style:              'dark',
      resizeOnFullScreen: true,
    },
    // Camera — cho phép upload ảnh profile
    Camera: {
      permissions: true,
    },
    // Local Notifications — nhắc nhở match, tin nhắn
    LocalNotifications: {
      smallIcon:          'ic_stat_icon_config_sample',
      iconColor:          '#e91e8c',  // Hot pink
      sound:              'beep.wav',
    },
    // Geolocation — tìm người ở gần
    Geolocation: {
      permissions: true,
    },
  },
};

export default config;
