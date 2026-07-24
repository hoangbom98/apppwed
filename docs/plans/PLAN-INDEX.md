# Plan Index — KJC Multi-Project Platform

> Tổng hợp tất cả implementation plans.  
> **Cập nhật lần cuối:** 2025

---

## Plans còn Active

*Không có plans nào đang pending.*

---

## Plans đã hoàn thành & đã xóa

Tất cả plan files bên dưới đã được implement đầy đủ và **đã xóa khỏi repo** (chỉ còn PLAN-INDEX.md này).

| Plan | Ghi chú |
|------|---------|
| `game-module-completion-plan.md` | 9/9 sub-tasks — daily checkin, missions, lucky wheel, agent tree |
| `phase1-foundation-completion-plan.md` | 7/7 sub-tasks — migrations, game/trade/dating/sports/hub/admin backend, swagger |
| `project-standardization-plan.md` | Done — validators, index.js, game rename, shared-ui, prisma schemas |
| `multi-project-platform-plan.md` | Done — JWT isolation, CORS, stats API, SKILL.md |
| `cleanup-junk-files-plan.md` | 6/6 done — dist artifacts, tsbuildinfo, stale prisma client, env duplicates |
| `prisma-consolidation-plan.md` | 4/4 done — orphan seed-config.js deleted, all.seed.js → index.ts orchestrator, AppCatalog seed verified, `seed` alias added |
| `app-distribution-platform-plan.md` | 6/6 done — Hub sw.js + manifest icons, Sports/Trade SW wiring, AppCatalog backend API + seed, Hub DownloadPage dynamic, Admin AppCatalog UI, SearchPage AutoComplete |
| `performance-optimization-plan.md` | 6/6 done — CLI updated, Vite configs trade/dating/sports, Admin lazy routes, compression middleware, httpCache on hot endpoints, Nginx proxy buffering |
| `standardize-missing-plan.md` | 6/6 done — ESLint config, unit tests (response + authService), Dockerfile + docker-compose, LICENSE, CONTRIBUTING.md, README badges |
| `auto-ops-platform-plan.md` | 9/9 done — RFM/CLV/Churn analyzers, daily reports, campaign automation, task manager, cron jobs, opsController + routes, frontend API + Operations Dashboard, routes registered |
| `scripts-refactor-plan.md` | Done — `_common.sh` shared helpers, all scripts refactored with `set -euo pipefail` + `source _common.sh`, idempotent guards |

---

## Tài liệu tham khảo

| File | Nội dung |
|------|---------|
| [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | Sơ đồ kiến trúc hệ thống |
| [`../MODULES.md`](../MODULES.md) | Danh sách endpoints từng module |
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md) | Hướng dẫn deploy VPS |
| [`../SETUP.md`](../SETUP.md) | Setup local dev |
| [`../project-audit-report.md`](../project-audit-report.md) | Báo cáo audit chuẩn hóa |
| [`../../code/backend/README.md`](../../code/backend/README.md) | Backend quick start |
