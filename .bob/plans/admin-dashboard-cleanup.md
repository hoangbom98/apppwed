# Admin Dashboard — Chuẩn hóa, Loại bỏ Trùng lặp, Hoàn thiện Modules

## Mục tiêu

Rà soát, chuẩn hóa và hoàn thiện toàn bộ `/apps/admin-dashboard/src/modules`:
1. Loại bỏ code comment thừa và các file stub không dùng.
2. Gỡ trùng lặp: Sports/Trade/Game có cả individual files lẫn `pages/index.tsx` định nghĩa cùng component.
3. Kết nối các trang đang orphaned (có file nhưng chưa có route + menu) vào registry.
4. Tạo route + menu cho 3 trang orphaned quan trọng: `FeatureFlagsPage`, `CskhEditorPage`, `FinancialAnalysisPage`.
5. Chuẩn hóa pattern export: mỗi module chỉ dùng một pattern (individual default-export files).
6. Xóa legacy `menu.tsx` không còn dùng.
7. Dọn dẹp file stub/orphaned: `banner-editor/`, `user/`, `dashboard/pages/`, các `*Layout.tsx` không dùng.
8. Chuẩn hóa `// @ts-nocheck` header và xóa comment code block.

---

## Phân tích vấn đề hiện tại

### Trùng lặp (Duplicate)
| Module | File trùng 1 (individual) | File trùng 2 (index.tsx) | Ghi chú |
|--------|--------------------------|--------------------------|---------|
| **Sports** | `SportsLeaguesPage.tsx`, `SportsTeamsPage.tsx`, etc. (default export) | `pages/index.tsx` xuất `SportsLeaguesPage` (named export) | Routes import từ individual files → index.tsx không dùng |
| **Trade** | `TradeKycPage.tsx`, `TradeOrdersPage.tsx`, etc. (default export) | `pages/index.tsx` xuất `TradeKycPage`, etc. (named export) | Routes import từ individual files → index.tsx không dùng |
| **Game** | `GameDepositsPage.tsx`, etc. (default export, rich UI) | `pages/index.tsx` xuất `GameDepositsPage` (CrudPage-based, khác nội dung) | **NGUY HIỂM**: hai implementations khác nhau |
| **Hub** | `AdminGamesPage.tsx` etc. là file riêng | Thực ra `pages/index.tsx` mới là nơi định nghĩa tất cả | Individual files chỉ re-export hoặc là proxy |

### Orphaned pages (có file, chưa route/menu)
| File | Path | Đề xuất |
|------|------|---------|
| `FeatureFlagsPage.tsx` | `/settings/feature-flags` | Thêm vào settings module menu + route |
| `CskhEditorPage.tsx` | `/settings/cskh` | Thêm vào settings module menu + route |
| `FinancialAnalysisPage.tsx` | `/group-finance/analysis` | Thêm vào finance module menu + route |
| `AdminAcademyCoursesPage.tsx` | `/hub/courses` hoặc `/academy-courses` | Thêm vào hub module menu + route |
| `StatisticsOverviewPage.tsx` | Dashboard — trùng với `Dashboard.tsx` | Xóa hoặc integrate vào Dashboard |
| `UserAnalyticsPage.tsx` | Không cần thiết — đã có `ProjectUsers` | Xóa |

### Stub/Unused files
| File | Vấn đề |
|------|--------|
| `core/routes/menu.tsx` | Legacy, không được import ở đâu |
| `game/pages/GameLayout.tsx` | Stub với `console.warn`, không dùng |
| `dating/pages/DatingLayout.tsx` | Stub, không dùng |
| `sports/pages/SportsLayout.tsx` | Stub với `console.log`, không dùng |
| `trade/pages/TradeLayout.tsx` | Stub với `console.log`, không dùng |
| `hub/pages/HubLayout.tsx` | Stub demo, không dùng |
| `banner-editor/` (cả folder) | Không có route, không có index.ts |
| `user/` (cả folder) | Không có route, không có index.ts |
| `dashboard/` (cả folder) | Không có route, không có index.ts |

---

## Sub-Tasks

---

### Sub-Task 1: Xóa file stub/orphaned không cần thiết

**Intent:** Loại bỏ các file và folder hoàn toàn không có tác dụng — không được import, không có route, không có ý nghĩa dự phòng.

**Expected Outcomes:**
- Xóa `core/routes/menu.tsx` (legacy, không import)
- Xóa 5 `*Layout.tsx` stub không dùng: `GameLayout.tsx`, `DatingLayout.tsx`, `SportsLayout.tsx`, `TradeLayout.tsx`, `HubLayout.tsx`
- Xóa toàn bộ `modules/user/` folder (`api.ts` + `pages/UserAnalyticsPage.tsx`)
- Xóa toàn bộ `modules/banner-editor/` folder
- Xóa `modules/dashboard/pages/StatisticsOverviewPage.tsx` + `modules/dashboard/api.ts` (folder `dashboard/pages/` có thể xóa)
- `modules/realtime/index.ts` giữ nguyên (vì AdminLayout vẫn import nó)

**Todo List:**
1. Kiểm tra lại không có import nào đến các file này (grep trước khi xóa)
2. Xóa `apps/admin-dashboard/src/core/routes/menu.tsx`
3. Xóa các file: `game/GameLayout.tsx`, `dating/DatingLayout.tsx`, `sports/SportsLayout.tsx`, `trade/TradeLayout.tsx`, `hub/HubLayout.tsx`
4. Xóa folder `modules/banner-editor/` (BannerEditorPage.tsx + api.ts)
5. Xóa folder `modules/user/` (api.ts + pages/UserAnalyticsPage.tsx)
6. Xóa `modules/dashboard/api.ts` và `modules/dashboard/pages/StatisticsOverviewPage.tsx`

**Relevant Context:**
- Grep pattern: `import.*menu` trước khi xóa menu.tsx
- Grep pattern: `BannerEditorPage|UserAnalyticsPage|StatisticsOverviewPage|GameLayout|DatingLayout|SportsLayout|TradeLayout|HubLayout` để xác nhận không được import

**Status:** [x] done

---

### Sub-Task 2: Gỡ trùng lặp Sports module

**Intent:** Sports module có 2 sources cho cùng pages: individual `.tsx` files (default export) và `pages/index.tsx` (named export). Routes đang dùng individual files. `pages/index.tsx` cần được xóa hoặc thay bằng re-exports.

**Expected Outcomes:**
- Routes vẫn import từ individual files (`SportsLeaguesPage.tsx`, etc.) — không đổi import trong routes
- Xóa `sports/pages/index.tsx` vì nó định nghĩa lại các component đã có trong individual files (gây nhầm lẫn)
- Không còn duplicate implementation

**Todo List:**
1. Đọc lại `sports/pages/index.tsx` và so sánh với individual files để xác nhận không có nội dung unique
2. Kiểm tra: `SportsUsersPage` trong `sports/pages/index.tsx` có được dùng ở đâu không? (Nếu không, xóa luôn)
3. Note: `sports/users` route dùng `<ProjectUserPage>` không phải `SportsUsersPage` → `SportsUsersPage` trong index.tsx không cần thiết
4. Xóa `sports/pages/index.tsx`

**Relevant Context:**
- `apps/admin-dashboard/src/core/routes/index.tsx` line 173-179 — sports routes import từ individual files
- `apps/admin-dashboard/src/modules/sports/pages/index.tsx` — chứa `SportsUsersPage`, `SportsLeaguesPage`, etc.
- Individual files: `SportsLeaguesPage.tsx`, `SportsTeamsPage.tsx`, etc. — các file này là nguồn thật

**Status:** [x] done

---

### Sub-Task 3: Gỡ trùng lặp Trade module

**Intent:** Trade module tương tự Sports — `pages/index.tsx` định nghĩa `TradeKycPage`, `TradeOrdersPage`, v.v. nhưng routes đang import từ individual files có implementation phong phú hơn.

**Expected Outcomes:**
- Routes vẫn import từ individual files
- `trade/pages/index.tsx` bị xóa (không có nội dung unique — `TradeUsersPage` không dùng ở routes, route dùng `<ProjectUserPage>`)
- Không còn duplicate definition

**Todo List:**
1. Xác nhận `TradeUsersPage` trong `trade/pages/index.tsx` không được import ở bất kỳ đâu
2. Xác nhận các `TradeKycPage`, `TradeOrdersPage`, etc. trong index.tsx là CrudPage-based stub (khác với individual files đầy đủ)
3. Xóa `trade/pages/index.tsx`

**Relevant Context:**
- `apps/admin-dashboard/src/core/routes/index.tsx` line 183-190 — trade routes import từ individual files
- `apps/admin-dashboard/src/modules/trade/pages/index.tsx` — chứa stub implementations
- Individual files: `TradeKycPage.tsx`, `TradeOrdersPage.tsx`, etc. — là implementation thật

**Status:** [x] done

---

### Sub-Task 4: Gỡ trùng lặp Game module

**Intent:** Game module nguy hiểm hơn vì `pages/index.tsx` định nghĩa `GameDepositsPage` (CrudPage-based), trong khi `GameDepositsPage.tsx` là implementation thật với approve/reject workflow. Routes đang import đúng từ individual files. `pages/index.tsx` có thêm `GameStatsBar` và `GameUsersPage` — cần kiểm tra xem có được dùng không.

**Expected Outcomes:**
- Routes vẫn import từ individual files
- `GameUsersPage` trong index.tsx không dùng (route dùng `<ProjectUserPage>`) → xóa
- `game/pages/index.tsx` bị xóa
- Không có duplicate

**Todo List:**
1. Xác nhận `GameUsersPage` không được import ở bất kỳ đâu ngoài index.tsx
2. Xác nhận các functions trong game index.tsx (CrudPage-based) khác với individual files
3. Xóa `game/pages/index.tsx`

**Relevant Context:**
- `apps/admin-dashboard/src/core/routes/index.tsx` line 152-160 — game routes import từ individual files
- `apps/admin-dashboard/src/modules/game/pages/index.tsx` — chứa CrudPage-based stub implementations

**Status:** [x] done

---

### Sub-Task 5: Kết nối FeatureFlagsPage và CskhEditorPage vào Settings module

**Intent:** `FeatureFlagsPage.tsx` và `CskhEditorPage.tsx` là các trang hoàn thiện, có API, nhưng chưa được đăng ký route và menu. Đây là các tính năng quan trọng cho ProDevs/Admin.

**Expected Outcomes:**
- Route `/settings/feature-flags` → `FeatureFlagsPage` (với `minRole: 'super_admin'`)
- Route `/settings/cskh` → `CskhEditorPage`
- Menu items trong `settings/index.ts` cho cả 2 routes mới
- `CskhEditorPage` phụ thuộc vào `settings/api/cskhApi.ts` — cần kiểm tra file này tồn tại

**Todo List:**
1. Kiểm tra `settings/api/cskhApi.ts` tồn tại và có đúng exports: `getCskhConfig`, `saveCskhConfig`, `CSKH_PROJECTS`
2. Thêm 2 route mới vào `core/routes/index.tsx`:
   - `/settings/feature-flags` → lazy import `FeatureFlagsPage`
   - `/settings/cskh` → lazy import `CskhEditorPage`
3. Thêm 2 menu items vào `settings/index.ts`:
   - `{ to: '/settings/feature-flags', icon: ToggleLeft, label: 'Feature Flags' }` (group: `settings_ext`)
   - `{ to: '/settings/cskh', icon: HeadphonesIcon, label: 'CSKH Editor' }` (group: `settings_ext`)
4. Import thêm icon cần thiết trong `settings/index.ts`
5. Xóa các comment code block trong FeatureFlagsPage và CskhEditorPage

**Relevant Context:**
- `apps/admin-dashboard/src/modules/settings/index.ts` — thêm menu items vào `settings_ext` group
- `apps/admin-dashboard/src/core/routes/index.tsx` — thêm lazy routes
- `apps/admin-dashboard/src/modules/settings/pages/FeatureFlagsPage.tsx` — target route page
- `apps/admin-dashboard/src/modules/settings/pages/CskhEditorPage.tsx` — target route page

**Status:** [x] done

---

### Sub-Task 6: Kết nối FinancialAnalysisPage vào Finance module

**Intent:** `finance/pages/FinancialAnalysisPage.tsx` là trang phân tích tài chính hoàn thiện nhưng không có route hoặc menu entry. Nên được thêm vào finance module.

**Expected Outcomes:**
- Route `/group-finance/analysis` → `FinancialAnalysisPage`
- Menu item trong `finance/index.ts`
- Trang accessible với `minRole: 'admin'`

**Todo List:**
1. Thêm route vào `core/routes/index.tsx`:
   - `{ path: 'group-finance/analysis', element: lazyPage(() => import('@admin/modules/finance/pages/FinancialAnalysisPage')) }`
2. Thêm menu item vào `finance/index.ts`:
   - `{ to: '/group-finance/analysis', icon: BookOpen, label: 'Phân tích tài chính' }` trong group `group-finance`
3. Xóa comment code block trong FinancialAnalysisPage

**Relevant Context:**
- `apps/admin-dashboard/src/modules/finance/index.ts` — thêm menu item
- `apps/admin-dashboard/src/core/routes/index.tsx` — Group Finance section
- `apps/admin-dashboard/src/modules/finance/pages/FinancialAnalysisPage.tsx`

**Status:** [x] done

---

### Sub-Task 7: Kết nối AdminAcademyCoursesPage vào Hub module

**Intent:** `hub/pages/AdminAcademyCoursesPage.tsx` là trang quản lý khóa học cho Academy project, tuy nhiên nó sử dụng import path sai (`@/modules/hub/api`) và chưa có route/menu.

**Expected Outcomes:**
- Fix import path trong `AdminAcademyCoursesPage.tsx`: `@/modules/hub/api` → `../api` hoặc `@admin/modules/hub/api`
- Route `/hub/courses` → `AdminAcademyCoursesPage` (gated bởi hub projectId)
- Menu item trong `hub/index.ts`

**Todo List:**
1. Đọc `hub/index.ts` để xem cấu trúc menu hiện tại
2. Fix import path trong `AdminAcademyCoursesPage.tsx`
3. Thêm route vào `core/routes/index.tsx`
4. Thêm menu item vào `hub/index.ts`

**Relevant Context:**
- `apps/admin-dashboard/src/modules/hub/pages/AdminAcademyCoursesPage.tsx` — fix import
- `apps/admin-dashboard/src/modules/hub/index.ts` — thêm menu item
- `apps/admin-dashboard/src/core/routes/index.tsx` — Hub section

**Status:** [x] done

---

### Sub-Task 8: Xóa comment code thừa toàn bộ modules

**Intent:** Loại bỏ các khối comment code (`// đã bị comment`) và các file comment header không cần thiết. Giữ lại các JSDoc comment quan trọng. KHÔNG xóa comment giải thích logic hoặc TODO còn ý nghĩa.

**Expected Outcomes:**
- Không còn `// @ts-nocheck` trên đầu file (vì codebase đang dùng TypeScript)... **Giữ lại** vì đây là project đang chuyển đổi dần, `@ts-nocheck` giúp tránh break build
- Xóa các block comment code (code bị comment out, không phải explanation)
- Xóa file comment header trùng lặp (`// frontend/admin-dashboard/src/...` ở đầu file)

**Todo List:**
1. Grep tất cả file trong modules để tìm các block comment code: `// import`, `// return`, `// const` patterns
2. Đọc và xóa comment code không cần thiết trong các file đã được xác định
3. Cụ thể: các file `GameLayout.tsx`, `DatingLayout.tsx`, `SportsLayout.tsx`, `TradeLayout.tsx` đã được xóa ở Sub-Task 1
4. Kiểm tra `SportsOverviewPage.tsx`, `TradeConfig.tsx`, `GameConfig.tsx`, etc.

**Relevant Context:**
- Toàn bộ `apps/admin-dashboard/src/modules/`
- Pattern cần xóa: console.warn, console.log debug, blocks of commented-out code

**Status:** [x] done

---

### Sub-Task 9: Chuẩn hóa registry.ts và AdminLayout imports

**Intent:** `registry.ts` có `// @ts-nocheck` không cần thiết (file TypeScript thuần). AdminLayout có import `realtime` hardcoded. Dọn dẹp và đảm bảo consistency.

**Expected Outcomes:**
- `registry.ts` sạch, không còn header file path comment thừa
- AdminLayout bootstrap imports đầy đủ (không cần thêm realtime — realtime được wire trực tiếp qua CORE_GROUPS intentionally)
- Đảm bảo `// @ts-nocheck` chỉ có ở file cần thiết

**Todo List:**
1. Xóa `// @ts-nocheck` khỏi `registry.ts` (file này thuần TypeScript, không cần skip type check)
2. Xóa file path comment header (`// frontend/admin-dashboard/src/modules/registry.ts`) khỏi registry.ts
3. Xem xét liệu có cần giữ `// @ts-nocheck` ở các file khác không (giữ nếu file dùng nhiều `any`, các interop)

**Relevant Context:**
- `apps/admin-dashboard/src/modules/registry.ts`
- `apps/admin-dashboard/src/core/layouts/AdminLayout.tsx`

**Status:** [x] done

---

## Thứ tự thực hiện

```
Sub-Task 1 (xóa stub)
    ↓
Sub-Task 2 (Sports dedup)
Sub-Task 3 (Trade dedup)     ← song song với Sub-Task 2 và 4
Sub-Task 4 (Game dedup)
    ↓
Sub-Task 5 (Settings orphaned pages)
Sub-Task 6 (Finance orphaned pages)  ← song song với 5 và 7
Sub-Task 7 (Hub orphaned page)
    ↓
Sub-Task 8 (cleanup comments)
Sub-Task 9 (registry chuẩn hóa)
```

## Files bị ảnh hưởng (tóm tắt)

**Xóa:**
- `apps/admin-dashboard/src/core/routes/menu.tsx`
- `apps/admin-dashboard/src/modules/game/pages/GameLayout.tsx`
- `apps/admin-dashboard/src/modules/game/pages/index.tsx`
- `apps/admin-dashboard/src/modules/dating/pages/DatingLayout.tsx`
- `apps/admin-dashboard/src/modules/sports/pages/SportsLayout.tsx`
- `apps/admin-dashboard/src/modules/sports/pages/index.tsx`
- `apps/admin-dashboard/src/modules/trade/pages/TradeLayout.tsx`
- `apps/admin-dashboard/src/modules/trade/pages/index.tsx`
- `apps/admin-dashboard/src/modules/hub/pages/HubLayout.tsx`
- `apps/admin-dashboard/src/modules/user/` (folder)
- `apps/admin-dashboard/src/modules/banner-editor/` (folder)
- `apps/admin-dashboard/src/modules/dashboard/` (folder)

**Sửa đổi:**
- `apps/admin-dashboard/src/core/routes/index.tsx` — thêm 4 routes mới
- `apps/admin-dashboard/src/modules/settings/index.ts` — thêm 2 menu items
- `apps/admin-dashboard/src/modules/finance/index.ts` — thêm 1 menu item
- `apps/admin-dashboard/src/modules/hub/index.ts` — thêm 1 menu item
- `apps/admin-dashboard/src/modules/hub/pages/AdminAcademyCoursesPage.tsx` — fix import
- `apps/admin-dashboard/src/modules/registry.ts` — xóa @ts-nocheck và header comment

**Giữ nguyên (intentional):**
- `apps/admin-dashboard/src/modules/realtime/index.ts` — giữ, AdminLayout import nó
- `apps/admin-dashboard/src/modules/realtime/RealtimeLayout.tsx` — hardwired trong CORE_GROUPS (đúng thiết kế)
- `apps/admin-dashboard/src/modules/auth/pages/Login.tsx` — bootstrap, không phải module registry
