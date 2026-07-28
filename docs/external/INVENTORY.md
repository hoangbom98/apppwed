# External repository inventory

Cập nhật: 2026-07-28. Nguồn chi tiết: `config/external/repos.json`.

## Tổng quan

- Mapping yêu cầu: 27 repository.
- Đã clone: 26 repository.
- Thiếu: `task-tracker`.
- Source mirror: `apps/external/`.
- Workspace/Turbo: không đăng ký external mặc định.
- Port/domain/healthcheck: chưa xác nhận, ghi `unknown`.

## Trạng thái

| Trạng thái | Số lượng | Ghi chú |
|---|---:|---|
| `reference-only` | 17 | Chỉ tham khảo; chưa có approval build/deploy |
| `blocked-secret` | 6 | Có `.env`/`.env.local` cần scrub/rotate |
| `unsupported-toolchain` | 3 | Java/Gradle/Android cần pipeline riêng |
| `missing-clone` | 1 | `task-tracker` chưa có checkout |
| **Tổng** | **27** | |

## Repository matrix

| ID | Source | Destination | Subproject/toolchain | SHA | Status |
|---|---|---|---|---|---|
| landing | dubai-dreams | `apps/external/landing` | Vite frontend + Node API | `1919b0c` | reference-only |
| fortress | Fortress | `apps/external/fortress` | Next.js | `476ef26` | reference-only |
| prodevs | prodevs | `apps/external/prodevs` | Node CLI/TypeScript | `34183db` | reference-only |
| shammarianas | shammarianas | `apps/external/shammarianas` | Vite + Firebase Functions | `e5f000b` | blocked-secret |
| bank-app | Bank_App | `apps/external/bank-app` | Maven/Java | `2df87c5` | reference-only |
| bank-app-frontend | Bank_App-front_end | `apps/external/bank-app-frontend` | Next.js | `39b47b9` | blocked-secret |
| java-bank | Simple-Java-Bank-App | `apps/external/java-bank` | Gradle/Android | `08669d3` | unsupported-toolchain |
| academy | nurman_lms | `apps/external/academy` | Next.js | `c1d34db` | blocked-secret |
| academy-backend | PROFICIENT-LMS-Backend | `apps/external/academy-backend` | Node API | `41d392d` | blocked-secret |
| innovatics | innovatics-project | `apps/external/innovatics` | Node API | `7115dcb` | reference-only |
| invest-frontend | investment | `apps/external/invest-frontend` | Vite frontend + Node API | `45ded70` | reference-only |
| invest-backend | Qc-investment-project | `apps/external/invest-backend` | Node API | `588691b` | reference-only |
| market-admin | E-commerce-Admin2 | `apps/external/market-admin` | Node app | `c800de8` | reference-only |
| market-api | E-commerce-Api | `apps/external/market-api` | Node API | `8afa490` | reference-only |
| crypto | crypto-app | `apps/external/crypto` | Vite frontend | `faba19e` | reference-only |
| social | React-Native-Social-App | `apps/external/social` | React Native | `60043a9` | unsupported-toolchain |
| chat | Socket.io-with-simple-message-app | `apps/external/chat` | Node realtime | `cd04482` | reference-only |
| task-tracker | task-tracker | `apps/external/task-tracker` | unknown | — | missing-clone |
| todo | Todo-App | `apps/external/todo` | Node API + Vite frontend | `6923750` | reference-only |
| event | event-management | `apps/external/event` | Node API | `6c7379d` | blocked-secret |
| expenses | Expenses-Tracker-using-React.js | `apps/external/expenses` | Create React App | `ef44b05` | reference-only |
| graph-ai | graph_rag | `apps/external/graph-ai` | NestJS API + Next.js | `e66763b` | reference-only |
| ssl-monitor | domain-SSL_Monitor | `apps/external/ssl-monitor` | Maven/Java | `fa20b33` | unsupported-toolchain |
| anonymous-voice | anonymous-voice | `apps/external/anonymous-voice` | Next.js + Node API | `2a78b50` | reference-only |
| counter | Counter-App | `apps/external/counter` | Gradle/Android | `6098289` | unsupported-toolchain |
| nurman-backend | NurmanBackEnd | `apps/external/nurman-backend` | Node API | `d9eb827` | blocked-secret |
| paylock | paylock-js | `apps/external/paylock` | Node library | `cb14c0e` | reference-only |

## Verified facts and limitations

- Package manifests exist at multiple nested paths; package names are not globally unique (`backend`, `client`).
- External repository lockfiles/toolchain versions and production commands require per-subproject validation before workspace/CI inclusion.
- `.env` or `.env.local` exists in `shammarianas`, `academy`, `academy-backend`, `bank-app-frontend`, `event`, and `nurman-backend`; values were not recorded.
- No port, DNS, TLS certificate, upstream bind address or health endpoint is approved by this inventory.
