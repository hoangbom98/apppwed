# 📁 CẤU TRÚC DỰ ÁN — GAME H5 (frontend/game)

## ⚠️ Quy tắc bắt buộc — KHÔNG được vi phạm

| Quy tắc | Đúng ✅ | Sai ❌ |
|---|---|---|
| Chỉ dùng `src/views/` cho các trang | `views/TrangChu.tsx` | `pages/Home.tsx` |
| Chỉ dùng `src/layout/` cho layout shell | `layout/KhungUngDung.tsx` | `layouts/` hoặc `components/layout/` |
| API phải dùng bộ `api/api*.ts` | `api/apiGame.ts` | `api/game.ts` |
| Utils phải dùng bộ tiếng Việt | `utils/tainguyen.ts` | `utils/assets.ts` |
| Components phải dùng tên tiếng Việt | `components/the-bai/TheGame.tsx` | `components/game/GameCard.tsx` |
| **KHÔNG tạo** `src/pages/` | — | ❌ Đã xóa, không tạo lại |
| **KHÔNG tạo** `src/layouts/` | — | ❌ Đã xóa, không tạo lại |

---

## Quy tắc đặt tên
| Loại file | Quy tắc | Ví dụ |
|---|---|---|
| **Views** (trang) | PascalCase tiếng Việt | `TrangChu.tsx`, `DangNhap.tsx` |
| **Components** | PascalCase tiếng Việt theo chức năng | `TheGame.tsx`, `BannerQuangCao.tsx` |
| **Layout** | PascalCase tiếng Việt | `KhungUngDung.tsx`, `DauTrang.tsx` |
| **API** | `apiTenChucNang.ts` | `apiGame.ts`, `apiViTien.ts` |
| **Store** | `storeTenChucNang.ts` | `storeDangNhap.ts`, `storeViTien.ts` |
| **Utils** | camelCase tiếng Việt | `dinhDang.ts`, `hangso.ts`, `tainguyen.ts` |

---

## 📂 Cấu trúc thư mục

```
src/
├── App.tsx                         ← Điểm vào, định nghĩa tất cả route
├── main.tsx                        ← Bootstrap React + QueryClient
├── index.css                       ← Tailwind base + animations
│
├── layout/                         ← Bố cục ứng dụng (CHỈ dùng thư mục này)
│   ├── index.ts                    ← Barrel export
│   ├── KhungUngDung.tsx            ← Layout wrapper (Header + Outlet + BottomNav)
│   ├── DauTrang.tsx                ← Header: logo, số dư, thông báo, avatar
│   └── ThanhDieuHuong.tsx          ← Bottom nav mobile (5 tab)
│
├── views/                          ← Tất cả trang (CHỈ dùng thư mục này)
│   ├── index.ts                    ← Barrel export
│   ├── TrangChu.tsx                ← / (Home)
│   ├── DangNhap.tsx                ← /dang-nhap (Login)
│   ├── DangKy.tsx                  ← /dang-ky (Register)
│   ├── HoSo.tsx                    ← /ho-so (Profile)
│   ├── DanhSachGame.tsx            ← /game (Games list)
│   ├── ChiTietGame.tsx             ← /game/:slug (Game detail + iframe)
│   ├── NapTien.tsx                 ← /nap-tien (Deposit)
│   ├── RutTien.tsx                 ← /rut-tien (Withdraw)
│   ├── TaiKhoanNganHang.tsx        ← /tai-khoan-ngan-hang (Bank Account)
│   ├── VipCuaToi.tsx               ← /vip (VIP system)
│   ├── DaiLy.tsx                   ← /dai-ly (Agent referral)
│   ├── KhuyenMai.tsx               ← /khuyen-mai (Promotions list)
│   ├── ChiTietKhuyenMai.tsx        ← /khuyen-mai/:id (Promotion detail)
│   ├── ThongBao.tsx                ← /thong-bao (Notifications)
│   ├── BangDieuKhien.tsx           ← /bang-dieu-khien (Dashboard người chơi)
│   └── TaiApp.tsx                  ← /tai-app (App download page)
│
├── components/
│   ├── the-bai/                    ← Các thẻ hiển thị game
│   │   ├── index.ts
│   │   └── TheGame.tsx             ← GameCard + GameGrid + GameFilter + GamePreviewModal
│   │
│   ├── trang-chu/                  ← Các component trang chủ
│   │   ├── index.ts
│   │   ├── BannerQuangCao.tsx      ← Slider banner quảng cáo
│   │   └── LuoiDanhMuc.tsx         ← Lưới danh mục game
│   │
│   ├── khuyen-mai/                 ← Các component khuyến mãi
│   │   ├── index.ts
│   │   └── TheKhuyenMai.tsx        ← Thẻ + danh sách khuyến mãi
│   │
│   ├── vi-tien/                    ← Các component ví tiền
│   │   ├── index.ts
│   │   └── DanhSachGiaoDich.tsx    ← Danh sách giao dịch + thẻ nạp tiền
│   │
│   ├── vip/                        ← VIP components
│   │   ├── index.ts
│   │   ├── TienTrinh.tsx           ← Thanh tiến trình VIP (chuẩn)
│   │   └── VipProgress.tsx         ← Alias của TienTrinh (giữ để tương thích)
│   │
│   ├── dai-ly/                     ← Đại lý components
│   │   ├── index.ts
│   │   └── GioiThieuDaiLy.tsx      ← Block mã giới thiệu
│   │
│   ├── xac-thuc/                   ← Form xác thực
│   │   ├── index.ts
│   │   ├── FormDangNhap.tsx        ← Form đăng nhập
│   │   └── FormDangKy.tsx          ← Form đăng ký
│   │
│   ├── bang-dieu-khien/            ← Dashboard components (tiếng Việt)
│   │   ├── index.ts
│   │   ├── TheThongKe.tsx
│   │   ├── GiaoDichGanDay.tsx
│   │   ├── BieuDoGiaoDich.tsx
│   │   └── ThongKeGame.tsx
│   │
│   ├── dashboard/                  ← Dashboard UI components (dùng bởi views/BangDieuKhien)
│   │   ├── SummaryCards.tsx
│   │   ├── TransactionChart.tsx
│   │   └── RecentTransactions.tsx
│   │
│   ├── chung/                      ← UI atoms dùng chung (chuẩn)
│   │   ├── index.ts
│   │   ├── NutBam.tsx              ← Button
│   │   ├── The.tsx                 ← Card container
│   │   ├── TrangRong.tsx           ← Empty state
│   │   ├── BienGioiLoi.tsx         ← Error boundary
│   │   ├── VongQuay.tsx            ← Loading spinner
│   │   ├── HopThoai.tsx            ← Modal dialog
│   │   └── KhungTaiTrang.tsx       ← Skeleton loading
│   │
│   └── common/                     ← UI atoms tiếng Anh (dùng bởi App.tsx & layout/)
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx       ← Dùng bởi App.tsx
│       ├── LoadingSpinner.tsx
│       ├── Modal.tsx
│       └── Skeleton.tsx
│
├── api/                            ← Gọi API backend (CHỈ dùng api*.ts)
│   ├── httpClient.ts               ← Axios instance (đã cấu hình token, refresh)
│   ├── apiGame.ts                  ← API danh mục + game + session
│   ├── apiViTien.ts                ← API số dư + nạp + rút + giao dịch
│   ├── apiXacThuc.ts               ← API login/register/profile/password
│   ├── apiDaiLy.ts                 ← API hệ thống đại lý
│   ├── apiThongBao.ts              ← API thông báo
│   ├── apiKhuyenMai.ts             ← API khuyến mãi
│   ├── apiVip.ts                   ← API VIP levels + claim
│   ├── apiNganHang.ts              ← API tài khoản ngân hàng
│   └── apiBangDieuKhien.ts         ← API dữ liệu dashboard + types
│
├── store/                          ← Zustand state management
│   ├── storeDangNhap.ts            ← Auth: user, token, login/logout
│   ├── storeGame.ts                ← Game: categories, activeCategory
│   ├── storeViTien.ts              ← Wallet: balance
│   ├── storeGiaoDien.ts            ← UI: darkMode, loading states
│   ├── authStore.ts                ← Re-export từ @ui (wrapper)
│   ├── walletStore.ts              ← Re-export từ @ui (wrapper)
│   ├── gameStore.ts                ← Zustand store độc lập
│   └── uiStore.ts                  ← Re-export từ @ui (wrapper)
│
├── utils/                          ← Hàm tiện ích (CHỈ dùng tên tiếng Việt)
│   ├── tainguyen.ts                ← Tất cả đường dẫn ảnh WAP + providers
│   ├── hangso.ts                   ← Hằng số: payment methods, VIP colors
│   ├── dinhDang.ts                 ← Format VND, ngày giờ, số
│   └── xacThuc.ts                  ← Hàm validate: email, phone, password
│
└── hooks/                          ← Custom React hooks
    ├── useSocket.ts                ← WebSocket: balance realtime
    ├── useWallet.ts                ← Hook đồng bộ số dư
    └── useDeviceOS.ts              ← Detect Android/iOS
```

---

## 🗺️ Bảng map Route URL

| URL | View | Ghi chú |
|---|---|---|
| `/` | `TrangChu` | Trang chủ public |
| `/dang-nhap` | `DangNhap` | Standalone (không có layout) |
| `/dang-ky` | `DangKy` | Standalone |
| `/tai-app` | `TaiApp` | Download app, standalone |
| `/game` | `DanhSachGame` | Danh sách game + filter |
| `/game/:slug` | `ChiTietGame` | Chi tiết + iframe game |
| `/khuyen-mai` | `KhuyenMai` | Danh sách khuyến mãi |
| `/khuyen-mai/:id` | `ChiTietKhuyenMai` | Chi tiết khuyến mãi |
| `/nap-tien` | `NapTien` | 🔒 Nạp tiền |
| `/rut-tien` | `RutTien` | 🔒 Rút tiền |
| `/tai-khoan-ngan-hang` | `TaiKhoanNganHang` | 🔒 Quản lý tài khoản NH |
| `/vip` | `VipCuaToi` | 🔒 VIP + claim thưởng |
| `/dai-ly` | `DaiLy` | 🔒 Hệ thống đại lý |
| `/ho-so` | `HoSo` | 🔒 Hồ sơ cá nhân |
| `/thong-bao` | `ThongBao` | 🔒 Thông báo |
| `/bang-dieu-khien` | `BangDieuKhien` | 🔒 Dashboard thống kê người chơi |

### Alias URL (giữ tương thích ngược)
| Alias | Redirect về |
|---|---|
| `/download` | `/tai-app` |
| `/login` | `/dang-nhap` |
| `/register` | `/dang-ky` |
| `/games` | `/game` |
| `/promotions` | `/khuyen-mai` |
| `/deposit` | `/nap-tien` |
| `/withdraw` | `/rut-tien` |
| `/bank-account` | `/tai-khoan-ngan-hang` |
| `/agent` | `/dai-ly` |
| `/profile` | `/ho-so` |
| `/notifications` | `/thong-bao` |
| `/dashboard` | `/bang-dieu-khien` |

---

## 🖼️ Tài nguyên WAP (public/wap/)

| Thư mục | Nội dung |
|---|---|
| `wap/fs/game/wap/` | ~120 logo nhà cung cấp game (.webp) |
| `wap/fs/live/` | Logo live casino |
| `wap/fs/lottery/` | Logo xổ số |
| `wap/fs/sport/` | Logo thể thao |
| `wap/vip/` | vip-1.png → vip-10.png + vip-*_bg.png |
| `wap/tabbar/` | tabbar_icon1-6 (nor + select states) |
| `wap/img/` | Logo, ví, quà tặng, thông báo, hồng bao... |
