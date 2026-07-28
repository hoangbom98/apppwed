# LKVIP Mobile Native — Architecture

## Pattern: MVVM + Repository

```
UI Layer (Compose)
    │
    ▼
ViewModel (StateFlow / LiveData)
    │
    ▼
Repository (single source of truth)
    ├── Remote: Retrofit → LkvipApiService
    └── Local:  EncryptedSharedPreferences / Room (nếu cần cache)
```

## Module structure

```
com.lkvip.mobile/
├── api/
│   ├── LkvipApiClient.kt        # Retrofit instance, OkHttp interceptors
│   ├── LkvipApiService.kt       # @GET/@POST interface definitions
│   └── LkvipAuthenticator.kt    # OkHttp Authenticator: auto-refresh JWT
├── auth/
│   └── TokenManager.kt          # EncryptedSharedPreferences wrapper
├── data/
│   ├── UserPreferencesRepository.kt
│   └── LkvipRepoRegistry.kt     # Central registry của tất cả Repository instances
├── ui/
│   ├── theme/                   # MaterialTheme, colors, typography
│   ├── navigation/              # NavGraph, destinations
│   ├── EcosystemModulesScreen.kt
│   └── ...                      # Mỗi feature = 1 subfolder
└── MainActivity.kt
```

## Data flow (ví dụ: Login)

```
LoginScreen (Compose)
  → onLoginClick(email, password)
  → LoginViewModel.login(email, password)
  → AuthRepository.login(email, password)
  → LkvipApiService.login(LoginRequest)
  → POST /api/auth/login
  ← LoginResponse(accessToken, refreshToken, user)
  → TokenManager.save(accessToken, refreshToken)
  ← Result.Success(user)
  → LoginViewModel._uiState = LoggedIn
  → LoginScreen recompose → navigate to Dashboard
```

## Authentication

- **Token storage**: `EncryptedSharedPreferences` (Android Keystore-backed AES256)
- **Token injection**: `AuthInterceptor` thêm `Authorization: Bearer <token>` vào mọi request
- **Auto-refresh**: `LkvipAuthenticator` implements `okhttp3.Authenticator` — khi nhận 401, thử refresh, retry request. Nếu refresh fail → logout
- **Token format**: JWT HS256, cùng secret với web app (`JWT_SECRET` trong backend `.env`)

## Error handling

```kotlin
// Mọi repo method trả sealed class Result
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val code: Int, val message: String) : Result<Nothing>()
    object NetworkError : Result<Nothing>()
}
```

## Dependency Injection

Dùng **Hilt** (Dagger2 wrapper). Mọi ViewModel và Repository đều được inject — không new trực tiếp.

```kotlin
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel()
```

## Threading

- Network calls: `Dispatchers.IO` (coroutines)
- UI updates: `Dispatchers.Main` (collect StateFlow trong Compose LaunchedEffect)
- Không dùng RxJava — chỉ Kotlin Coroutines + Flow
