# Báo cáo tối ưu hóa codebase LKVIP

> Cập nhật sau mỗi đợt scan theo `docs/CODEBASE_SCAN.md`.

## 1. Tổng quan

- Ngày scan: TBD
- Phạm vi: `apps/` + `packages/` source
- Apps: backend, hub, game, trading, dating, sports, admin-dashboard, mobile
- Packages: ui, types, utils, constants
- Công cụ: jscpd, depcheck, madge, cloc nếu có, pnpm why

## 2. Chỉ số

| Chỉ số | Kết quả | Nguồn report |
|--------|---------|--------------|
| Tổng dòng source | TBD | `scan-reports/cloc-summary.txt` |
| Dòng trùng lặp | TBD | `scan-reports/jscpd-console.txt` |
| Tỷ lệ trùng lặp | TBD | `scan-reports/jscpd*` |
| Circular imports | TBD | `scan-reports/madge-circular-*.txt` |
| Dependencies thừa cần review | TBD | `scan-reports/depcheck-*.json` |
| Dependencies version lệch | TBD | `scan-reports/shared-deps.txt` |
| Bundle lớn nhất | TBD | `scan-reports/bundle-size.txt` |

## 3. Phát hiện chính

- TBD

## 4. Hành động đề xuất

- [ ] Di chuyển utility dùng chung thật sự vào `packages/utils`.
- [ ] Di chuyển component/hook ổn định, dùng nhiều app vào `packages/ui`.
- [ ] Di chuyển type dùng chung vào `packages/types`.
- [ ] Di chuyển constants/enums/config keys vào `packages/constants`.
- [ ] Chuẩn hóa version dependency vào `pnpm-workspace.yaml` catalog khi hợp lý.
- [ ] Xóa dependency sau khi xác minh import/build/runtime.

## 5. Không làm tự động

- Không thêm package shared mới nếu `packages/ui|utils|types|constants` đủ dùng.
- Không xóa dependency chỉ dựa vào depcheck vì có false positive.
- Không refactor hàng loạt nếu chưa có build/typecheck xanh.
- Không đổi behavior UI/API trong PR chỉ nhằm giảm trùng lặp.
- Không dùng Docker cho workflow scan/setup/deploy chuẩn.

## 6. Checklist sau tối ưu

- [ ] `pnpm typecheck:all` pass.
- [ ] `pnpm build:frontends` pass nếu chạm frontend/shared package.
- [ ] `pnpm --filter lkvip-backend run build` pass nếu chạm backend/shared types.
- [ ] UI thay đổi đã kiểm tra bằng browser.
- [ ] Docs cập nhật nếu đổi cấu trúc/script/package/API.
