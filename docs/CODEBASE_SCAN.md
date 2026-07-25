# Codebase Scan & Optimization Guide

Mục tiêu: phát hiện code trùng lặp, dependency thừa/thiếu, vòng import, bundle lớn và cơ hội đưa logic dùng chung vào `packages/`.

Nguyên tắc dự án: không dùng Docker cho workflow chuẩn. Scan chạy trực tiếp bằng pnpm/native tools trong `/var/LKVIP`.

## 1. Công cụ đề xuất

Không cài tự động nếu chưa được team duyệt. Dùng `pnpm dlx` để chạy tạm khi cần scan một lần.

| Công cụ | Mục đích | Cách chạy khuyến nghị |
|---------|----------|-----------------------|
| `jscpd` | Phát hiện copy-paste code | `pnpm dlx jscpd ...` |
| `depcheck` | Dependency thừa/thiếu | `pnpm dlx depcheck ...` |
| `madge` | Dependency graph, circular imports | `pnpm dlx madge ...` |
| `dependency-cruiser` | Luật dependency nâng cao | `pnpm dlx dependency-cruiser ...` |
| `cloc` | Đếm dòng code | Cài bằng package OS nếu có, hoặc bỏ qua |
| `pnpm why` | Vì sao package tồn tại | Có sẵn trong pnpm |

Nếu cần dùng lâu dài, mở PR riêng thêm devDependencies và scripts.

## 2. Phạm vi scan chuẩn

Scan source active, bỏ qua output/cache/vendor:

- Include: `apps/*/src`, `packages/*/src`, `apps/backend/src`, `apps/backend/prisma`.
- Exclude: `node_modules`, `dist`, `.turbo`, `.pnpm-store`, `.claude`, `logs`, `data`, `coverage`, `scan-reports`.

Active apps:

```text
apps/backend
apps/hub
apps/game
apps/trading
apps/dating
apps/sports
apps/admin-dashboard
apps/mobile
```

Shared packages:

```text
packages/ui
packages/types
packages/utils
packages/constants
```

## 3. Script scan tổng hợp

Script đề xuất: `scripts/scan-repo.sh`.

Đặc điểm:

- Chỉ đọc source và ghi report vào `scan-reports/`.
- Không cài dependency.
- Không xóa file.
- Không sửa package.json.
- Dùng `pnpm dlx` cho tool chưa có trong repo.
- Bỏ qua `cloc` nếu máy chưa cài.

Chạy:

```bash
bash scripts/scan-repo.sh
```

## 4. Shared dependency analysis

Script đề xuất: `scripts/analyze-shared-deps.js`.

Mục tiêu:

- Đọc `package.json` trong `apps/*` và `packages/*`.
- Tìm dependency dùng ở >=3 app.
- Tìm version không đồng nhất.
- Gợi ý dependency nên nằm trong `pnpm-workspace.yaml` catalog hoặc package shared.

Chạy riêng:

```bash
node scripts/analyze-shared-deps.js
```

## 5. Lệnh scan riêng lẻ

### Code duplication

```bash
pnpm dlx jscpd apps packages \
  --pattern "**/*.{ts,tsx,js,jsx}" \
  --ignore "**/{node_modules,dist,.turbo,.pnpm-store,.claude,coverage,scan-reports}/**" \
  --reporters console,json \
  --output scan-reports/jscpd
```

Mục tiêu dài hạn: duplication `< 5%` cho source active.

### Dependency check từng app

```bash
for app in apps/* packages/*; do
  if [ -f "$app/package.json" ]; then
    name=$(basename "$app")
    pnpm dlx depcheck "$app" --json > "scan-reports/depcheck-$name.json" 2>/dev/null || true
  fi
done
```

Kết quả depcheck cần review thủ công. Với Vite/Tailwind/Prisma/generated imports, false positive thường gặp.

### Circular imports

```bash
for src in apps/*/src packages/*/src; do
  if [ -d "$src" ]; then
    name=$(basename "$(dirname "$src")")
    pnpm dlx madge --extensions ts,tsx,js,jsx --circular "$src" > "scan-reports/madge-circular-$name.txt" 2>&1 || true
  fi
done
```

### Bundle size

Build trước:

```bash
pnpm build:frontends
```

Đọc dist size:

```bash
du -sh apps/*/dist 2>/dev/null | sort -h > scan-reports/bundle-size.txt
```

## 6. Cách xử lý phát hiện

### Component UI trùng

Ưu tiên đưa vào `packages/ui` nếu:

- Có >=3 app dùng pattern tương tự.
- API component ổn định.
- Không phụ thuộc quá sâu vào business riêng app.

Không đưa vào shared nếu component chỉ giống bề ngoài nhưng behavior khác nhau.

### Utility trùng

Ưu tiên đưa vào `packages/utils` nếu:

- Pure function.
- Không phụ thuộc React/router/store/API.
- Có test hoặc dễ test.

Ví dụ: format tiền, format ngày, debounce/throttle, normalize payload.

### Types trùng

Đưa vào `packages/types` nếu type dùng giữa FE/BE hoặc >=2 app.

### Constants trùng

Đưa vào `packages/constants` nếu là enum, project IDs, route constants, config keys. Không đưa secrets/default production values.

### API client trùng

Chỉ tách khi đã thống nhất interface auth/token/error handling. Tránh tạo `packages/api-client` mới nếu chưa có nhu cầu rõ; ưu tiên tái dùng `packages/ui`/`packages/utils` hiện có trước.

### Dependency thừa

Không xóa dependency chỉ vì depcheck báo. Cần xác minh:

1. Import tĩnh/dynamic.
2. Vite plugin/config usage.
3. Prisma/generated/tooling usage.
4. Runtime global hoặc CSS import.
5. Build/test sau khi bỏ.

## 7. Báo cáo cuối

Tạo hoặc cập nhật `docs/OPTIMIZATION_REPORT.md` sau khi chạy scan.

Template:

```markdown
# Báo cáo tối ưu hóa codebase LKVIP

## 1. Tổng quan

- Ngày scan: YYYY-MM-DD
- Phạm vi: apps + packages source
- Apps: backend, hub, game, trading, dating, sports, admin-dashboard, mobile
- Packages: ui, types, utils, constants

## 2. Chỉ số

| Chỉ số | Kết quả |
|--------|---------|
| Tổng dòng source | TBD |
| Dòng trùng lặp | TBD |
| Tỷ lệ trùng lặp | TBD |
| Circular imports | TBD |
| Dependencies thừa cần review | TBD |
| Bundle lớn nhất | TBD |

## 3. Phát hiện chính

- TBD

## 4. Hành động đề xuất

- [ ] Di chuyển utility thật sự dùng chung vào `packages/utils`.
- [ ] Di chuyển component ổn định, dùng nhiều app vào `packages/ui`.
- [ ] Chuẩn hóa constants vào `packages/constants`.
- [ ] Xóa dependency sau khi xác minh import/build/test.

## 5. Không làm ngay

- Không thêm package shared mới nếu `packages/ui|utils|types|constants` đủ dùng.
- Không xóa dependency dựa trên false positive.
- Không refactor hàng loạt nếu chưa có test/build xanh.
```

## 8. Checklist trước PR tối ưu

- [ ] Có report scan gắn kèm hoặc link artifact.
- [ ] Không đổi behavior UI/API ngoài phạm vi refactor.
- [ ] `pnpm typecheck:all` pass.
- [ ] `pnpm build:frontends` pass nếu chạm frontend/shared packages.
- [ ] `pnpm --filter lkvip-backend run build` pass nếu chạm backend/shared types.
- [ ] Không thêm dependency mới nếu chưa được review.
- [ ] Tài liệu cập nhật nếu đổi cấu trúc packages/scripts.
