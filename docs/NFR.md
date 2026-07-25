# Non-Functional Requirements — LKVIP

## 1. Performance

| Scope | Target |
|-------|--------|
| Auth/login | p95 < 200ms khi cache/DB khỏe |
| Authenticated API | p95 < 500ms |
| Health/config cached endpoints | p95 < 200ms |
| Chat/realtime | Socket.IO latency theo vùng triển khai |
| Build frontends | Theo dõi qua CI/local build |

Baseline kỹ thuật:

- Redis cache cho dashboard/config khi phù hợp.
- Prisma clients theo từng schema.
- PM2 process `lkvip-api`.
- Nginx gzip/proxy/static serving.
- Public config cache header ngắn cho `/api/shared/config`.

## 2. Scalability

Giai đoạn hiện tại: single VPS native.

```text
Nginx → PM2 lkvip-api → MySQL 6 schemas + Redis
```

Scale ưu tiên:

1. Tối ưu query/cache/index.
2. Giảm duplicate/bundle bằng shared packages và lazy loading.
3. Scale up VPS nếu CPU/RAM thiếu.
4. Scale out nhiều app server/DB replica khi có nhu cầu thật.

Không dùng Docker làm hướng scale/deploy chuẩn.

## 3. Reliability

| Metric | Target |
|--------|--------|
| Production uptime | 99.9% |
| RTO | < 4 giờ |
| RPO | < 24 giờ |
| Deploy health | `/health` JSON `status == healthy` |

Health endpoint phải kiểm tra DB/Redis đủ để phản ánh degraded/healthy. Deploy không chỉ dựa vào HTTP 200.

## 4. Security

| Hạng mục | Yêu cầu |
|----------|---------|
| Secrets | Không commit, không in ra docs/log/chat |
| Env | `apps/backend/.env`, chmod `600` production |
| JWT/Encryption | Secret tối thiểu 32 ký tự |
| CORS | Production bắt buộc cấu hình `CORS_ORIGINS` |
| DB/Redis/API port | Không expose trực tiếp public |
| Public config | Chỉ trả non-secret ProjectConfig |
| SQL injection | Dùng Prisma parameterized queries |
| XSS | Không render HTML tùy ý; không dùng `dangerouslySetInnerHTML` nếu không bắt buộc |

## 5. Maintainability

- Shared UI/hooks: `packages/ui`.
- Shared types: `packages/types`.
- Shared helpers: `packages/utils`.
- Shared constants: `packages/constants`.
- Không thêm dependency nếu dependency hiện có xử lý được.
- Scan trùng lặp theo `docs/CODEBASE_SCAN.md` trước refactor lớn.
- Refactor không đổi behavior nếu mục tiêu chỉ là giảm trùng lặp.

## 6. Testing requirements

Checks thường dùng:

```bash
pnpm lint:all
pnpm typecheck:all
pnpm test
pnpm build:frontends
pnpm --filter lkvip-backend run build
```

Khi chỉ sửa docs, kiểm tra link/stale term là đủ.

Khi đổi frontend/shared packages:

- Build app bị ảnh hưởng.
- Build toàn bộ frontends nếu thay shared package.
- Kiểm tra UI bằng browser nếu là thay đổi giao diện.

Khi đổi backend:

- Build backend.
- Test endpoint liên quan.
- Kiểm tra `/health`.

## 7. Observability

- PM2 logs: `pm2 logs lkvip-api`.
- Metrics endpoint: `/metrics`.
- Health endpoint: `/health`.
- Sentry optional nếu có `SENTRY_DSN`.
- Prometheus/Grafana config trong `config/monitoring/` nếu được triển khai.

## 8. Deployment requirements

- Deploy root: `/var/LKVIP`.
- Deploy user: `lkvip`.
- Backend internal: `127.0.0.1:5000`.
- Public domains hiện tại: root, hub, trade, sports, admin, api.
- `game`/`dating` chưa public DNS/Nginx trong config hiện tại.
- Canonical guide: `docs/DEPLOYMENT.md`.

## 9. Performance testing

Nếu cần load test, dùng script native trên host/dev machine, không Docker.

Ví dụ k6 path chuẩn nếu thêm test:

```bash
k6 run tests/load/<scenario>.js
```

Không dùng path cũ `source/docs/tests/...`.

## 10. Optimization targets

Các target dưới đây là mục tiêu, không phải cam kết hiện trạng:

| Chỉ số | Mục tiêu |
|--------|----------|
| Duplicate source | < 5% sau refactor lớn |
| Bundle | Giảm theo từng app, đo từ `apps/*/dist` |
| Dependency drift | Version shared đưa vào catalog khi hợp lý |
| Build time | Theo dõi qua CI/local, tối ưu sau khi có baseline |
