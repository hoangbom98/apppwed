# LKVIP Mobile Native — Android (Kotlin)

Ứng dụng Android native viết bằng **Kotlin + Jetpack Compose**, được thiết kế để giao tiếp với LKVIP backend qua REST API.

> **Phân biệt với `apps/mobile/`:**
> `apps/mobile/` là Capacitor PWA wrapper (TypeScript) — wrap admin-dashboard thành app native.
> `apps/mobile-native/` là ứng dụng Android native viết từ đầu bằng Kotlin.

---

## Cấu trúc thư mục

```
apps/mobile-native/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/lkvip/mobile/
│   │   │   │   ├── api/                    # Retrofit clients
│   │   │   │   │   ├── LkvipApiClient.kt
│   │   │   │   │   ├── LkvipApiService.kt
│   │   │   │   │   └── LkvipAuthenticator.kt
│   │   │   │   ├── data/                   # Repositories
│   │   │   │   │   ├── UserPreferencesRepository.kt
│   │   │   │   │   └── LkvipRepoRegistry.kt
│   │   │   │   ├── ui/                     # Jetpack Compose screens
│   │   │   │   │   └── EcosystemModulesScreen.kt
│   │   │   │   ├── auth/                   # Auth & token management
│   │   │   │   │   └── TokenManager.kt
│   │   │   │   └── MainActivity.kt
│   │   │   ├── res/                        # Layouts, drawables, strings
│   │   │   └── AndroidManifest.xml
│   │   ├── test/                           # Unit tests (JUnit)
│   │   └── androidTest/                    # Instrumented tests (Espresso)
│   └── build.gradle.kts
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── build.gradle.kts                        # Root Gradle config
├── settings.gradle.kts
├── gradle.properties
├── local.properties.example               # Template — KHÔNG commit local.properties
├── .gitignore
├── ARCHITECTURE.md
├── API.md
└── CHANGELOG.md
```

---

## Yêu cầu môi trường

| Công cụ | Phiên bản |
|---------|-----------|
| Android Studio | Hedgehog (2023.1.1) trở lên |
| JDK | 17 (Zulu hoặc Temurin) |
| Android SDK | API 34 (target), API 26 (min) |
| Kotlin | 1.9+ |
| Gradle | 8.4+ |

---

## Cài đặt ban đầu

```bash
# 1. Clone monorepo (nếu chưa có)
git clone https://github.com/your-org/lkvip.git /var/LKVIP
cd /var/LKVIP/apps/mobile-native

# 2. Copy và điền local.properties
cp local.properties.example local.properties
# Điền sdk.dir=/path/to/Android/sdk

# 3. Mở Android Studio
# File → Open → chọn /var/LKVIP/apps/mobile-native
# Gradle sync tự động khi mở

# 4. Build debug APK từ CLI
./gradlew assembleDebug
```

---

## Kết nối LKVIP Backend

API base URL được cấu hình trong [`app/src/main/java/com/lkvip/mobile/api/LkvipApiClient.kt`](app/src/main/java/com/lkvip/mobile/api/LkvipApiClient.kt):

```kotlin
// Development
const val BASE_URL_DEV  = "http://10.0.2.2:5000/api/"  // Android emulator → localhost

// Staging / Production (đặt trong local.properties hoặc BuildConfig)
const val BASE_URL_PROD = "https://api.tc-gaming.live/api/"
```

> `10.0.2.2` là alias của `localhost` trên Android emulator (map về `127.0.0.1` của máy host).

### Authentication flow

1. POST `/auth/login` → nhận `accessToken` + `refreshToken`
2. `TokenManager` lưu token vào **EncryptedSharedPreferences** (bất kể JWT — không plain SharedPreferences)
3. `LkvipAuthenticator` tự động refresh khi nhận 401
4. Logout: xóa token + clear Preferences

---

## Build variants

| Variant | API URL | Signing |
|---------|---------|---------|
| `debug` | `http://10.0.2.2:5000` | Debug keystore |
| `staging` | `https://api.tc-gaming.live` | Debug keystore |
| `release` | `https://api.tc-gaming.live` | Production keystore (GitHub Secret) |

---

## CI/CD

GitHub Actions workflow: [`.github/workflows/android-native-ci.yml`](../../.github/workflows/android-native-ci.yml)

| Trigger | Action |
|---------|--------|
| Push `develop` (path: `apps/mobile-native/**`) | Lint + Unit test + Build debug APK |
| Push `main` | Build release AAB + Upload to Play Store (nếu đã cấu hình) |
| `workflow_dispatch` | Build thủ công chọn variant |

### Secrets cần thêm vào GitHub

```
ANDROID_KEYSTORE_BASE64      # base64 của file .jks
ANDROID_KEY_ALIAS            # alias của key trong keystore
ANDROID_KEY_PASSWORD         # password của key
ANDROID_STORE_PASSWORD       # password của keystore
FIREBASE_APP_ID_NATIVE       # App ID trên Firebase (cho App Distribution)
FIREBASE_SERVICE_ACCOUNT     # JSON service account (share với Capacitor apps)
```

---

## Docs liên quan

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Kiến trúc MVVM, data flow, module structure
- [`API.md`](API.md) — Danh sách endpoints, request/response models
- [`CHANGELOG.md`](CHANGELOG.md) — Lịch sử thay đổi
- [`docs/mobile/README.md`](../../docs/mobile/README.md) — Overview toàn bộ mobile strategy (Capacitor + Native)
