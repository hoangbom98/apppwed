# @lkvip/mobile-core — Shared Android Library

Kotlin Android library module dùng chung cho cả hai native apps:
- [`apps/mobile-native`](../../apps/mobile-native) — Staff / Operations app
- [`apps/mobile-native-enterprise`](../../apps/mobile-native-enterprise) — C-Level Enterprise app

---

## Mục đích

Tránh copy-paste các class cốt lõi giữa 2 app. Mọi thay đổi về API client, auth flow, hoặc user preferences chỉ cần thực hiện **một lần** tại đây.

---

## Classes được chia sẻ

| Class | Package | Mô tả |
|---|---|---|
| `LkvipTokenManager` | `auth` | JWT access/refresh token storage (SharedPreferences) |
| `LkvipAuthInterceptor` | `api` | OkHttp interceptor — inject Bearer token |
| `LkvipAuthenticator` | `api` | OkHttp authenticator — auto-refresh on 401 |
| `LkvipApiClient` | `api` | Retrofit + OkHttp factory (singleton per baseUrl) |
| `LkvipCoreApiService` | `api` | Base Retrofit interface — auth + health endpoints |
| `LkvipUserPreferences` | `data` | SharedPreferences wrapper — darkMode, locale, displayName |
| `BuildConstants` | `api` | Build-time constants (API URL, debug flag) |

---

## Cách integrate vào app

### 1. `settings.gradle.kts` của app

```kotlin
// Trỏ đến module trong monorepo
includeBuild("../../packages/mobile-core")
// hoặc nếu dùng composite build:
include(":mobile-core")
project(":mobile-core").projectDir = File("../../packages/mobile-core")
```

### 2. `app/build.gradle.kts` của app

```kotlin
dependencies {
    implementation(project(":mobile-core"))
}
```

### 3. Sử dụng trong app

```kotlin
// Auth / Token
val tokenManager = LkvipTokenManager.getInstance(context)
tokenManager.saveTokens(accessToken, refreshToken, "admin")

// API Client
val apiClient = LkvipApiClient.getInstance(context, "https://api.tc-gaming.live/api/")
val service = apiClient.create(MyAppApiService::class.java)

// User Preferences
val prefs = LkvipUserPreferences.getInstance(context)
prefs.isDarkMode = true
```

---

## Build

Module này là Android Library (`com.android.library`).

```bash
# Từ thư mục mobile-native hoặc mobile-native-enterprise
./gradlew :mobile-core:assembleRelease
```

---

## Dependencies (transitive — exposed via `api()`)

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Retrofit2 + Gson | 2.12.0 | HTTP client + JSON |
| OkHttp | 4.12.0 | Network layer |
| OkHttp Logging | 4.12.0 | Debug logging |
| Coroutines | 1.8.1 | Async/suspend functions |

---

## Quy tắc

- **Không** thêm business logic của app vào đây — chỉ infrastructure / shared utilities
- **Không** thêm UI (Compose) vào đây — mỗi app có theme riêng
- **Có thể** thêm Room entities/DAOs dùng chung nếu schema giống nhau giữa 2 app
