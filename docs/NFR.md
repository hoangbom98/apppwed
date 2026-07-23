# Non-Functional Requirements (NFR) — KJC Platform v2.0

---

## 1. Hiệu năng (Performance)

### 1.1 Throughput Targets (TPS)

| Module | Target TPS | Ghi chú |
|--------|-----------|---------|
| **Login / Auth** | 50 req/s | Rate limited: 20 req/min/IP |
| **Dashboard stats** | 200 req/s | Cached Redis 60s |
| **Payment (deposit/withdraw)** | 100 tx/s | ACID transactions, retry queue |
| **Game session** | 500 req/s | Per game module |
| **Chat / Realtime** | 1000 msg/s | Qua Socket.IO |
| **Public API (health, docs)** | Không giới hạn | Nginx cache |

### 1.2 Latency Targets (API Response Time)

| Percentile | Target | Scope |
|-----------|--------|-------|
| p50 (median) | < 100ms | Tất cả authenticated APIs |
| **p95** | **< 500ms** | Tất cả authenticated APIs |
| p99 | < 1000ms | Tất cả authenticated APIs |
| p95 | < 200ms | Login, health check, cached endpoints |

> **Cách đo:** Thêm `prom-client` middleware ghi histogram latency per-route.

### 1.3 Baseline Hiện tại

Các biện pháp đã triển khai để đạt targets trên:
- Redis cache cho dashboard stats (TTL 60s) và config (TTL 300s)
- Prisma connection pooling (mặc định pool size theo DB)
- PM2 cluster mode — tận dụng tất cả CPU cores
- Nginx gzip compression cho response lớn
- HTTP Cache-Control headers qua `httpCache.js` middleware

---

## 2. Khả năng mở rộng (Scalability)

### 2.1 Chiến lược Scale hiện tại (Single VPS)

```
Phase 1 (hiện tại): Single VPS + PM2 Cluster
    → Scale UP: tăng RAM/CPU VPS
    → Scale OUT: PM2 instances = số CPU cores

Phase 2 (khi cần > 10k concurrent): Multi-VPS
    → Nginx load balancing across multiple app servers
    → MySQL replication (1 master + 1 replica read-only)
    → Redis Sentinel hoặc Redis Cluster
    → Shared session storage (Redis)
```

### 2.2 Database Sharding

**Chiến lược:** Domain-based sharding (đã triển khai)
- **Shard key:** Project/domain (hub, game, trade, dating, sports, admin)
- 6 databases độc lập → không có cross-database foreign keys
- Mỗi database có thể di chuyển sang server riêng độc lập

**Khi nào cần sharding sâu hơn:**
- Table > 50M rows → partitioning theo `created_at` (range partitioning)
- Single DB > 50GB → xem xét tách thêm

### 2.3 Auto-scaling Trigger (Phase 2)

| Metric | Ngưỡng trigger scale out |
|--------|--------------------------|
| CPU sustained > 70% | Thêm app server |
| Memory > 80% | Thêm app server hoặc tăng RAM |
| MySQL connections > 70% max | Tăng `max_connections` hoặc thêm replica |
| Redis memory > 70% | Tăng maxmemory |

---

## 3. Độ tin cậy (Reliability)

### 3.1 SLA Uptime

| Environment | Uptime Target | Max Downtime/năm |
|-------------|--------------|------------------|
| Production | **99.9%** | 8.7 giờ |
| Staging | 95% | 18 ngày |

### 3.2 Recovery Objectives

| Metric | Target | Cơ chế |
|--------|--------|--------|
| **RTO** (Recovery Time Objective) | **< 4 giờ** | PM2 auto-restart + runbook |
| **RPO** (Recovery Point Objective) | **< 24 giờ** | Daily backup lúc 2 AM |
| MTTR (Mean Time to Repair) | < 2 giờ | Runbook + on-call |

### 3.3 Fault Tolerance

- **PM2:** `max_restarts: 10`, `restart_delay: 3000ms` — tự restart khi crash
- **Database:** Retry logic qua Prisma connection pool
- **Redis:** Fallback graceful — codebase không crash nếu Redis down (cache miss)
- **Cron jobs:** Mỗi job độc lập, lỗi một job không ảnh hưởng các job khác
- **Health check:** `/health/live` endpoint — PM2 và deploy script dùng để verify

---

## 4. Bảo mật (Security)

### 4.1 Mã hóa

| Loại dữ liệu | Phương pháp | Ghi chú |
|-------------|------------|---------|
| Password | bcryptjs, salt rounds = 10 | Không thể giải mã ngược |
| PII (số điện thoại, CCCD) | AES-256-CBC | Key trong env `ENCRYPTION_KEY` |
| JWT tokens | HS256 (HMAC-SHA256) | Khóa 64+ ký tự |
| Data in transit | TLS 1.2+ (HTTPS) | Nginx SSL termination |
| Data at rest | MySQL encrypted InnoDB (optional) | Cấu hình MySQL level |

### 4.2 Authentication & Authorization

| Cơ chế | Chi tiết |
|--------|---------|
| JWT Access Token | Expiry: 2h |
| JWT Refresh Token | Expiry: 30 ngày |
| 2FA (TOTP) | Google Authenticator, optional per user |
| RBAC | super_admin > admin > viewer |
| Password Policy | Tối thiểu 8 ký tự, có số + chữ hoa |

### 4.3 API Protection

| Attack | Biện pháp |
|--------|----------|
| Brute force | `authLimiter`: 20 req/min/IP |
| DDoS | Nginx `limit_req`, `publicLimiter`: 100 req/min |
| SQL Injection | Prisma parameterized queries (100% prepared statements) |
| XSS | Helmet `xssFilter` + `contentSecurityPolicy` |
| CSRF | JWT Bearer token (không dùng cookies) |
| Bot | Bot detector trong `src/risk/botDetector.js` |

### 4.4 Key Management

| Secret | Lưu trữ | Rotation |
|--------|---------|---------|
| JWT secrets | `.env` file (chmod 600) | Mỗi 6 tháng |
| DB passwords | `.env` file (chmod 600) | Mỗi 3 tháng |
| ENCRYPTION_KEY | `.env` file (chmod 600) | Không xoay (key derivation) |
| SSH keys | `~/.ssh/` (chmod 600) | Hàng năm |

> **Roadmap bảo mật cao hơn:** HashiCorp Vault hoặc AWS Secrets Manager khi scale lên multi-server.

---

## 5. Tuân thủ pháp lý (Compliance)

### 5.1 Phạm vi áp dụng

| Quy định | Áp dụng? | Trạng thái |
|----------|----------|-----------|
| **PDPA** (Việt Nam) | Có — nếu xử lý dữ liệu cá nhân người Việt | Cần đánh giá |
| **GDPR** (EU) | Có — nếu có user EU | Cần đánh giá nếu mở rộng |
| **KYC/AML** | Có — với module giao dịch tài chính | KYC module đã có (`kycController.js`, `amlService.js`) |

### 5.2 Data Retention Policy

| Loại dữ liệu | Thời gian lưu trữ | Cơ chế xóa |
|-------------|-------------------|------------|
| Audit logs | 90 ngày | Cron auto-delete |
| Security logs (low/medium severity) | 30 ngày | Cron auto-delete |
| Transaction records | 7 năm | Manual archive |
| Personal data | Theo yêu cầu của user (right to erasure) | Admin action |
| Chat logs | 1 năm | Cron archive |

### 5.3 KYC Levels

| Level | Yêu cầu | Giới hạn giao dịch |
|-------|---------|-------------------|
| `unverified` | Email xác nhận | Nạp < 1 triệu/ngày |
| `basic` | Phone + Email | Nạp < 5 triệu/ngày |
| `verified` | CCCD/CMND | Nạp < 50 triệu/ngày |
| `enhanced` | CCCD + selfie + bank link | Không giới hạn |

---

## 6. Kiểm thử (Testing Requirements)

### 6.1 Coverage Targets

| Layer | Minimum Coverage | Target |
|-------|-----------------|--------|
| `shared/utils/` | **80%** | 95% |
| `shared/services/` | **60%** | 80% |
| `shared/base/` | **80%** | 95% |
| `modules/admin/controllers/` | **60%** | 75% |
| `modules/trade/`, `modules/game/` | **40%** | 60% |

### 6.2 Performance Testing

Công cụ: **k6** (JavaScript-based load testing)

```bash
# Install k6
brew install k6  # macOS
# hoặc: snap install k6  # Ubuntu

# Chạy load test
k6 run source/docs/tests/load-test.js
```

Target kịch bản:
- Login: 100 concurrent users × 60 giây
- Dashboard: 200 concurrent users × 60 giây
- Payment: 50 concurrent users × 120 giây

### 6.3 Security Testing

- `npm audit` trong CI pipeline (weekly)
- Manual penetration test: mỗi 6 tháng (OWASP Top 10 checklist)
- Dependency scanning: `npm audit --audit-level=high` fail CI nếu HIGH/CRITICAL
