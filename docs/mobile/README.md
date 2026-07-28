# LKVIP Mobile Strategy

LKVIP có **2 track mobile song song**:

| | `apps/mobile/` | `apps/mobile-native/` |
|---|---|---|
| **Loại** | Capacitor PWA wrapper | Android native (Kotlin) |
| **Công nghệ** | TypeScript + Capacitor v7 | Kotlin + Jetpack Compose |
| **Content** | Wrap `admin-dashboard` SPA | App độc lập với UI riêng |
| **Build** | `pnpm build` → `cap sync` | `./gradlew assembleDebug` |
| **Target** | Admin staff (iOS + Android) | End users (Android trước) |
| **pnpm workspace** | ✅ `@lkvip/mobile` | ❌ (Gradle project) |
| **CI** | `firebase-distribute-android.yml` | `android-native-ci.yml` |

---

## Track 1: Capacitor (`apps/mobile/`)

Biến **Admin Dashboard** PWA thành app native cho iOS và Android.
Dùng cho nhân viên vận hành, không phải end-user.

→ Xem chi tiết: [`apps/mobile/README.md`](../../apps/mobile/) *(via `docs/mobile/README.md`)*

### Quick start

```bash
cd apps/mobile

# Cài dependencies
pnpm install

# Dev với livereload (trỏ vào Vite dev server)
# 1. Bỏ comment server.url trong capacitor.config.ts
# 2. Chạy admin dev server:
pnpm --filter @lkvip/admin run dev

# Sync và mở Android Studio
pnpm run sync:android
pnpm run open:android
```

### Build pipeline

```
pnpm build:admin (Vite)
       │
       ▼
apps/admin-dashboard/dist/
       │
       ▼
cap sync android  ←── capacitor.config.ts: webDir = '../admin-dashboard/dist'
       │
       ▼
apps/mobile/android/  (Gradle project, git-ignored)
       │
       ▼
./gradlew assembleDebug  ──→  app-debug.apk
```

---

## Track 2: Native (`apps/mobile-native/`)

Ứng dụng Android native viết bằng Kotlin + Jetpack Compose dành cho **end users**.
Giao tiếp trực tiếp với LKVIP backend qua Retrofit REST client.

→ Xem chi tiết: [`apps/mobile-native/README.md`](../../apps/mobile-native/README.md)

### Quick start

```bash
cd apps/mobile-native

# Copy và điền local.properties
cp local.properties.example local.properties
# Điền sdk.dir=/path/to/Android/Sdk

# Build debug APK
./gradlew assembleDebug

# Chạy unit tests
./gradlew test
```

### API connection

Android emulator → localhost: dùng `http://10.0.2.2:5000/api` (alias `127.0.0.1` của máy host).

---

## Quan hệ giữa 2 track

```
LKVIP Backend (apps/backend)
    ├── REST API (/api/*)
    │       │
    │       ├──── Capacitor app (apps/mobile/) ─── admin-dashboard PWA
    │       │           Auth: JWT cookie → HTTP header
    │       │
    │       └──── Native app (apps/mobile-native/) ─── Kotlin Retrofit
    │                   Auth: JWT → EncryptedSharedPreferences
    │
    └── WebSocket
            └──── Native app (Socket.IO → OkHttp WS)
```

Cả 2 track dùng **cùng JWT secret** và **cùng API endpoints** — không có API riêng cho mobile.

---

## CI/CD

| Workflow | Trigger | Output |
|---|---|---|
| `firebase-distribute-android.yml` | Push `develop` → `apps/{hub,game,trading,dating,sports,mobile}/**` | APK debug → Firebase App Distribution |
| `android-native-ci.yml` | Push `develop` → `apps/mobile-native/**` | Lint + Tests + APK → Firebase App Distribution |

---

## GitHub Secrets cần thiết

```
# Dùng chung cho cả 2 track
FIREBASE_SERVICE_ACCOUNT         # JSON service account

# Track 1 (Capacitor — mỗi SPA 1 App ID)
FIREBASE_APP_ID_HUB_ANDROID
FIREBASE_APP_ID_GAME_ANDROID
FIREBASE_APP_ID_TRADE_ANDROID
FIREBASE_APP_ID_DATING_ANDROID
FIREBASE_APP_ID_SPORTS_ANDROID

# Track 2 (Native)
FIREBASE_APP_ID_NATIVE
ANDROID_KEYSTORE_BASE64           # Release signing (base64 .jks)
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
ANDROID_STORE_PASSWORD
```
