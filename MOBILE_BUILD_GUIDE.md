# KJC Mobile App Build Guide

## Overview

Three SPAs have Capacitor configured for iOS/Android deployment:

| App | Package | App ID | Capacitor Plugins |
|-----|---------|--------|------------------|
| Hub | `@kjc/hub` | `com.kjc.hub` | PushNotifications, Keyboard |
| Game | `@kjc/game` | `com.kjc.game` | PushNotifications, Keyboard, KeepAwake |
| Dating | `@kjc/dating` | `com.kjc.dating` | PushNotifications, Keyboard, Camera, Geolocation, LocalNotifications |

---

## Quick Build (All Apps)

```bash
# From workspace root
bash source/scripts/build-mobile.sh

# Single app
bash source/scripts/build-mobile.sh game

# Multiple apps
bash source/scripts/build-mobile.sh hub dating
```

---

## Prerequisites

### macOS (iOS + Android)
```bash
# Node 20 + pnpm (required)
node --version  # ≥ 20
pnpm --version  # ≥ 9

# iOS: Xcode (App Store)
xcode-select --install
sudo xcode-select --switch /Applications/Xcode.app

# Android: Android Studio (download from developer.android.com/studio)
# Set ANDROID_HOME in ~/.zshrc or ~/.bashrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Windows (Android only)
- Install Android Studio
- Set `ANDROID_HOME` environment variable

---

## iOS Release Build

### 1. Open in Xcode
```bash
# Build the Vite app + sync Capacitor
bash source/scripts/build-mobile.sh hub

# Open in Xcode
open source/frontend/hub/ios/App/App.xcworkspace
```

### 2. Configure Signing
1. Select project root → **Signing & Capabilities**
2. Select your **Team** (Apple Developer account)
3. Bundle Identifier: `com.kjc.hub` (or game/dating)
4. Enable **Automatically manage signing**

### 3. Configure Build Settings
- Set **Version** (e.g. `1.0.0`) and **Build** (e.g. `1`)
- Select **Any iOS Device (arm64)** as target

### 4. Archive & Upload
```
Product → Archive → Distribute App → App Store Connect → Upload
```

Or using Fastlane (optional):
```bash
cd source/frontend/hub/ios
fastlane beta  # requires Fastfile setup
```

---

## Android Release Build

### 1. Generate Keystore (once per app)
```bash
# Hub
keytool -genkey -v -keystore hub-release.jks \
  -alias hub -keyalg RSA -keysize 2048 -validity 10000

# Game
keytool -genkey -v -keystore game-release.jks \
  -alias game -keyalg RSA -keysize 2048 -validity 10000

# Dating
keytool -genkey -v -keystore dating-release.jks \
  -alias dating -keyalg RSA -keysize 2048 -validity 10000
```

Store the `.jks` files securely — **never commit to git**.

### 2. Configure Signing
Add to `source/frontend/hub/android/app/build.gradle`:
```gradle
android {
  signingConfigs {
    release {
      storeFile file('hub-release.jks')
      storePassword System.getenv('KEYSTORE_PASSWORD')
      keyAlias 'hub'
      keyPassword System.getenv('KEY_PASSWORD')
    }
  }
  buildTypes {
    release { signingConfig signingConfigs.release }
  }
}
```

### 3. Build APK / AAB
```bash
# Build the Vite app + sync
bash source/scripts/build-mobile.sh game

# Open in Android Studio
# OR build from command line:
cd source/frontend/game/android
./gradlew bundleRelease  # .aab for Play Store
./gradlew assembleRelease  # .apk for direct install
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Upload to Play Store
- Open **Play Console** → Create new release
- Upload the `.aab` file
- Fill in release notes → Review → Publish

---

## FCM Push Notifications (Native)

Push notifications require Firebase configuration:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project → Add iOS app (bundle ID: `com.kjc.hub`) + Android app
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)

### 2. Place Config Files
```
source/frontend/hub/ios/App/App/GoogleService-Info.plist
source/frontend/hub/android/app/google-services.json
```

### 3. Backend FCM Config
Set `FCM_SERVICE_ACCOUNT_KEY` in `.env` — path to Firebase service account JSON.

---

## Dev Server (Local Testing on Device)

Uncomment the dev server URL in `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:5173',  // Your machine's IP
  cleartext: true,
}
```

Find your IP:
- macOS/Linux: `ifconfig | grep inet`
- Windows: `ipconfig`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `cap sync` fails | Run `pnpm install` in the SPA directory first |
| iOS build error: "no signing certificate" | Configure signing in Xcode |
| Android build error: SDK not found | Set `ANDROID_HOME` env var |
| White screen on device | Check `server.url` in `capacitor.config.ts` matches API URL |
| Push not received | Verify `FCM_SERVICE_ACCOUNT_KEY` and Firebase config files |
