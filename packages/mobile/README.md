# @lkvip/mobile — Capacitor Mobile App

Wrapper Capacitor cho **LKVIP Admin Dashboard** — biến PWA thành app native iOS và Android.

## Cấu trúc

```
packages/mobile/
├── src/
│   └── index.ts          # Capacitor bridge entry (back button, deep link, status bar)
├── ios/                  # Tự sinh bởi `cap add ios` (không commit vào git)
├── android/              # Tự sinh bởi `cap add android` (không commit vào git)
├── capacitor.config.ts   # Cấu hình Capacitor
├── package.json
└── tsconfig.json
```

## Cài đặt ban đầu

```bash
cd code/packages/mobile

# Cài dependencies (Capacitor CLI + runtime)
pnpm install

# Thêm platform (chỉ làm 1 lần)
pnpm run add:ios        # Cần macOS + Xcode
pnpm run add:android    # Cần Android Studio
```

## Quy trình phát triển hàng ngày

### Development (livereload từ Vite dev server)

1. Chỉnh `capacitor.config.ts` — bỏ comment `server.url` và trỏ đến IP máy bạn:
   ```ts
   server: {
     url: 'http://192.168.1.x:5180',
     cleartext: true,
   }
   ```
2. Chạy dev server: `pnpm --filter @lkvip/admin run dev`
3. Sync và mở simulator:
   ```bash
   pnpm run sync
   pnpm run open:ios     # Xcode
   pnpm run open:android # Android Studio
   ```

### Production build

```bash
# Từ root monorepo
pnpm run build:mobile
# Hoặc từ packages/mobile
pnpm run build
```

Quy trình `build`:
1. Build admin-dashboard → `frontend/admin-dashboard/dist/`
2. `cap sync` — copy dist vào ios/ và android/
3. Mở Xcode / Android Studio để archive và upload

## Plugin đã cài

| Plugin | Mô tả |
|--------|-------|
| `@capacitor/core` | Capacitor core runtime |
| `@capacitor/app` | App lifecycle, deep links |
| `@capacitor/status-bar` | Điều chỉnh thanh trạng thái |
| `@capacitor/splash-screen` | Splash screen |
| `@capacitor/keyboard` | Bàn phím native |

## Plugin cần cài thêm (tuỳ nhu cầu)

```bash
# Push notifications
pnpm add @capacitor/push-notifications

# Bluetooth LE (IoT)
pnpm add @capacitor-community/bluetooth-le

# NFC
pnpm add @capacitor-community/nfc

# Barcode Scanner
pnpm add @capacitor-community/barcode-scanner

# Biometric Auth
pnpm add @aparajita/capacitor-biometric-auth
```

## Deep Link scheme

URL scheme: `lkvip.admin://`

Ví dụ: `lkvip.admin:///trade/kyc` → điều hướng đến trang KYC trong app.

Cấu hình trong:
- iOS: `ios/App/App/Info.plist` → `CFBundleURLSchemes`
- Android: `android/app/src/main/AndroidManifest.xml` → `intent-filter`
