# Plan Index — KJC Multi-Project Platform

> Tổng hợp tất cả implementation plans còn active.  
> **Cập nhật lần cuối:** 2025

---

## Plans còn Active

| Priority | Plan File | Mô tả | Tasks Pending |
|----------|-----------|-------|--------------|
| 🔴 High | [prisma-consolidation-plan.md](prisma-consolidation-plan.md) | Dọn dẹp orphan seed, rewrite `all.seed.js`, verify AppCatalog seed, thêm `seed` alias | 4 / 4 |
| 🔴 High | [app-distribution-platform-plan.md](app-distribution-platform-plan.md) | Hub PWA sw.js, Sports/Trade SW wiring, AppCatalog backend API, Hub DownloadPage dynamic, Admin Catalog UI, AutoComplete | 6 / 6 |
| 🟡 Medium | [performance-optimization-plan.md](performance-optimization-plan.md) | CLI sh-refs fix, Vite configs trade/dating/sports, Admin lazy routes, compression middleware, cache remember(), Nginx tuning | 6 / 6 |
| 🟡 Medium | [standardize-missing-plan.md](standardize-missing-plan.md) | ESLint config, Unit tests (shared utils + admin auth), Docker Dockerfile + compose, LICENSE, CONTRIBUTING.md, README badges | 6 / 6 |
| 🟢 Low | [auto-ops-platform-plan.md](auto-ops-platform-plan.md) | Auto-Ops platform: RFM/CLV phân tích, daily reports, campaign automation, Operations Dashboard frontend | 9 / 9 |
| 🟢 Low | [scripts-refactor-plan.md](scripts-refactor-plan.md) | Refactor 12 bash scripts thành function-based, idempotent, thêm `_common.sh` | 13 / 13 |

---

## Recommended Implementation Order

```
1. prisma-consolidation-plan      ← Sửa seed system trước (ảnh hưởng dev workflow)
2. app-distribution-platform-plan ← PWA + AppCatalog (user-facing, high value)
3. performance-optimization-plan  ← Vite configs + compression (build pipeline)
4. standardize-missing-plan       ← Tests + Docker (dev tooling)
5. auto-ops-platform-plan         ← Big feature (new models + analytics)
6. scripts-refactor-plan          ← Pure refactor, no behaviour change (last)
```

---

## Plans đã hoàn thành (archived)

Các plans sau đã được implement đầy đủ và xóa khỏi repo:

| Plan | Ghi chú |
|------|---------|
| `game-module-completion-plan.md` | 9/9 sub-tasks done — daily checkin, missions, lucky wheel, agent tree |
| `phase1-foundation-completion-plan.md` | 7/7 sub-tasks done — migrations, game/trade/dating/sports/hub/admin backend, swagger |
| `project-standardization-plan.md` | Done — validators, index.js, game rename, shared-ui, prisma schemas |
| `multi-project-platform-plan.md` | Done — JWT isolation, CORS, stats API, SKILL.md |
| `cleanup-junk-files-plan.md` | 6/6 done — dist artifacts, tsbuildinfo, stale prisma client, env duplicates |

---

## Tài liệu tham khảo

| File | Nội dung |
|------|---------|
| [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | Sơ đồ kiến trúc hệ thống |
| [`../MODULES.md`](../MODULES.md) | Danh sách endpoints từng module |
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md) | Hướng dẫn deploy VPS |
| [`../SETUP.md`](../SETUP.md) | Setup local dev |
| [`../project-audit-report.md`](../project-audit-report.md) | Báo cáo audit chuẩn hóa |
| [`../../source/backend/README.md`](../../source/backend/README.md) | Backend quick start |
