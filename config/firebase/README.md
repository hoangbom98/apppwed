# Firebase App Distribution — LKVIP Group

Thư mục này chứa cấu hình hỗ trợ phân phối bản build đến tester qua Firebase App Distribution.

---

## Cấu trúc

```
config/firebase/
├── ios/
│   └── ExportOptions-AdHoc.plist   # Cấu hình xcodebuild exportArchive (Ad Hoc)
├── testers/
│   ├── android-testers.txt         # Danh sách email tester Android (CLI thủ công)
│   └── ios-testers.txt             # Danh sách email tester iOS (CLI thủ công)
└── README.md                       # File này
```

---

## GitHub Actions Workflows

| File | Trigger | Mô tả |
|---|---|---|
| `.github/workflows/firebase-distribute-android.yml` | push `develop`, manual | Build APK + phân phối Android |
| `.github/workflows/firebase-distribute-ios.yml` | push `develop`, manual | Build IPA + phân phối iOS |

---

## Firebase Projects & App IDs

Mỗi sub-project có **App ID riêng** trên Firebase Console:

| Sub-project | Package (Android) | Bundle ID (iOS) | Firebase Secret (Android) | Firebase Secret (iOS) |
|---|---|---|---|---|
| Hub | `com.lkvip.hub` | `com.lkvip.hub` | `FIREBASE_APP_ID_HUB_ANDROID` | `FIREBASE_APP_ID_HUB_IOS` |
| Game | `com.lkvip.game` | `com.lkvip.game` | `FIREBASE_APP_ID_GAME_ANDROID` | `FIREBASE_APP_ID_GAME_IOS` |
| Trading | `com.lkvip.trade` | `com.lkvip.trade` | `FIREBASE_APP_ID_TRADE_ANDROID` | `FIREBASE_APP_ID_TRADE_IOS` |
| Dating | `com.lkvip.dating` | `com.lkvip.dating` | `FIREBASE_APP_ID_DATING_ANDROID` | `FIREBASE_APP_ID_DATING_IOS` |
| Sports | `com.lkvip.sports` | `com.lkvip.sports` | `FIREBASE_APP_ID_SPORTS_ANDROID` | `FIREBASE_APP_ID_SPORTS_IOS` |

> **Lấy App ID**: Firebase Console → chọn project → App Distribution → chọn app → biểu tượng bánh răng → App Settings.

---

## Tester Groups (Firebase Console)

Tạo các nhóm sau tại **App Distribution → Testers & Groups**:

| Group name | Phạm vi |
|---|---|
| `android-testers` | Tất cả tester Android |
| `ios-testers` | Tất cả tester iOS |
| `hub-testers` | Tester riêng của Hub |
| `game-testers` | Tester riêng của Game |
| `trade-testers` | Tester riêng của Trading |
| `dating-testers` | Tester riêng của Dating |
| `sports-testers` | Tester riêng của Sports |

---

## GitHub Secrets cần thiết

Thêm tại: **Repository → Settings → Secrets and variables → Actions**

### Chung (Android + iOS)
| Secret | Mô tả |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Nội dung file JSON service account. Tạo tại Firebase Console → Project Settings → Service Accounts → Generate new private key |

### Android (mỗi app)
| Secret | Giá trị |
|---|---|
| `FIREBASE_APP_ID_HUB_ANDROID` | App ID Hub trên Firebase (format `1:xxx:android:yyy`) |
| `FIREBASE_APP_ID_GAME_ANDROID` | App ID Game |
| `FIREBASE_APP_ID_TRADE_ANDROID` | App ID Trading |
| `FIREBASE_APP_ID_DATING_ANDROID` | App ID Dating |
| `FIREBASE_APP_ID_SPORTS_ANDROID` | App ID Sports |

### iOS (mỗi app + code signing)
| Secret | Mô tả |
|---|---|
| `FIREBASE_APP_ID_HUB_IOS` | App ID Hub iOS |
| `FIREBASE_APP_ID_GAME_IOS` | App ID Game iOS |
| `FIREBASE_APP_ID_TRADE_IOS` | App ID Trading iOS |
| `FIREBASE_APP_ID_DATING_IOS` | App ID Dating iOS |
| `FIREBASE_APP_ID_SPORTS_IOS` | App ID Sports iOS |
| `IOS_P12_BASE64` | `base64 -i certificate.p12 \| tr -d '\n'` |
| `IOS_P12_PASSWORD` | Mật khẩu đặt khi xuất .p12 từ Keychain Access |
| `IOS_KEYCHAIN_PASSWORD` | Bất kỳ chuỗi ngẫu nhiên (dùng cho keychain tạm trên runner) |
| `IOS_PROVISIONING_PROFILE_HUB_BASE64` | `base64 -i HubAdHoc.mobileprovision \| tr -d '\n'` |
| `IOS_PROVISIONING_PROFILE_GAME_BASE64` | Tương tự cho Game |
| `IOS_PROVISIONING_PROFILE_TRADE_BASE64` | Tương tự cho Trading |
| `IOS_PROVISIONING_PROFILE_DATING_BASE64` | Tương tự cho Dating |
| `IOS_PROVISIONING_PROFILE_SPORTS_BASE64` | Tương tự cho Sports |
| `APPLE_TEAM_ID` | 10 ký tự, xem tại developer.apple.com → Account → Membership |

---

## Phân phối thủ công qua Firebase CLI

```bash
# Cài đặt Firebase CLI (nếu chưa có)
npm install -g firebase-tools
firebase login

# Android — Hub
firebase appdistribution:distribute apps/hub/android/app/build/outputs/apk/debug/app-debug.apk \
  --app "1:XXXXXXXXXX:android:XXXXXXXXXXXXXXXX" \
  --release-notes "Hotfix login" \
  --groups "hub-testers,android-testers"

# iOS — Hub
firebase appdistribution:distribute path/to/Hub.ipa \
  --app "1:XXXXXXXXXX:ios:XXXXXXXXXXXXXXXX" \
  --release-notes "Hotfix login" \
  --testers-file config/firebase/testers/ios-testers.txt
```

---

## Luồng trải nghiệm tester

```
Developer push → develop
        ↓
GitHub Actions build APK / IPA
        ↓
Upload lên Firebase App Distribution
        ↓
Tester nhận email thông báo bản build mới
        ↓
Android: tải APK → cài trực tiếp
iOS:     đăng ký UDID → nhận link install → cài qua Safari
```

---

## Tài liệu tham khảo

- [Firebase App Distribution — Android CLI](https://firebase.google.com/docs/app-distribution/android/distribute-cli)
- [Firebase App Distribution — iOS CLI](https://firebase.google.com/docs/app-distribution/ios/distribute-cli)
- [Quản lý tester & nhóm](https://firebase.google.com/docs/app-distribution/manage-testers)
- [wzieba/Firebase-Distribution-Github-Action](https://github.com/wzieba/Firebase-Distribution-Github-Action)
- [Capacitor v7 Docs](https://capacitorjs.com/docs)
