# Changelog — LKVIP Mobile Native

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added
- Scaffold project: MVVM + Repository + Hilt DI structure
- `LkvipApiClient` — Retrofit instance with OkHttp interceptors
- `LkvipApiService` — Retrofit interface for LKVIP backend endpoints
- `LkvipAuthenticator` — auto-refresh JWT on 401
- `TokenManager` — EncryptedSharedPreferences-backed token storage
- `UserPreferencesRepository` — user settings persistence
- `LkvipRepoRegistry` — central repository registry
- `EcosystemModulesScreen` — Compose screen listing LKVIP ecosystem modules
- GitHub Actions CI workflow (`android-native-ci.yml`)
