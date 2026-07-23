# Operations Guide — KJC Platform v2.0

---

## 1. SLA & Uptime Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Uptime | 99.9% | ≤ 8.7 giờ downtime/năm |
| API Response (p95) | < 500ms | Cho endpoints authenticated |
| API Response (p95) | < 200ms | Cho health check, login |
| RTO (Recovery Time Objective) | < 4 giờ | Thời gian phục hồi sau sự cố |
| RPO (Recovery Point Objective) | < 24 giờ | Mất dữ liệu tối đa |
| Backup Frequency | Daily (2 AM) | Tự động, giữ 30 bản |

---

## 2. On-call Runbook

### Incident Severity Levels

| Cấp độ | Mô tả | Ví dụ | Response SLA |
|--------|-------|-------|--------------|
| **P1 — Critical** | Production down hoàn toàn | Server crash, DB unreachable | < 15 phút |
| **P2 — High** | Feature chính không hoạt động | Login fail, payment stuck | < 1 giờ |
| **P3 — Medium** | Ảnh hưởng một phần | Slow API, minor UI bug | < 4 giờ |
| **P4 — Low** | Cosmetic, không ảnh hưởng user | Text typo, minor display | < 1 ngày |

### P1 Response Checklist

```bash
# 1. Kiểm tra process status
pm2 status

# 2. Kiểm tra logs gần nhất
pm2 logs kjc-api --lines 100

# 3. Kiểm tra resources
free -h && df -h && top -bn1 | head -20

# 4. Kiểm tra MySQL
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# 5. Kiểm tra Redis
redis-cli ping && redis-cli info | grep used_memory_human

# 6. Restart nếu cần
pm2 reload ecosystem.config.js --update-env

# 7. Nếu không phục hồi — rollback
cd /var/www/website-admin
git log --oneline -5
# git reset --hard <previous-commit>
```

---

## 3. Security Patch Schedule

| Loại | Tần suất | Quy trình |
|------|----------|-----------|
| **Critical security patch** (CVE HIGH/CRITICAL) | Trong 24 giờ | Hot-fix branch → test → deploy ngay |
| **Dependencies update** (`npm audit`) | Hàng tuần (Thứ 2) | PR → CI → review → merge → deploy |
| **Minor feature / bug fix** | Bi-weekly | PR → CI → staging → production |
| **Major version** | Quarterly | RFC → testing period 2 tuần → deploy |

### Kiểm tra security hàng tuần

```bash
cd source/backend

# Kiểm tra vulnerabilities
npm audit

# Tự động fix các lỗi không breaking
npm audit fix

# Xem chi tiết
npm audit --audit-level=moderate
```

---

## 4. Log Management

### Vị trí logs

| Log | Đường dẫn | Retention |
|-----|-----------|-----------|
| Application (PM2) | `./logs/combined.log` | 30 ngày |
| Error | `./logs/error.log` | 90 ngày |
| Audit log (DB) | `admin_db.audit_logs` | 90 ngày (auto-clean) |
| Security log (DB) | `admin_db.security_logs` | 30 ngày (auto-clean) |
| Nginx access | `/var/log/nginx/access.log` | 14 ngày (logrotate) |
| MySQL slow query | `/var/log/mysql/slow.log` | 7 ngày |

### Xem logs thường dùng

```bash
# Xem logs realtime
pm2 logs kjc-api

# Xem logs lỗi
pm2 logs kjc-api --err --lines 50

# Tìm lỗi trong log file
grep "ERROR" ./logs/error.log | tail -50

# Audit logs của admin (qua API)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/admin/logs/audit?limit=50
```

---

## 5. Database Maintenance

### Kiểm tra health MySQL

```bash
# Connections đang active
mysql -u root -p -e "SHOW PROCESSLIST;"

# Table sizes
mysql -u root -p -e "
SELECT table_name, ROUND(data_length/1024/1024, 2) AS 'Data (MB)',
       ROUND(index_length/1024/1024, 2) AS 'Index (MB)'
FROM information_schema.tables
WHERE table_schema = 'game_db'
ORDER BY data_length DESC LIMIT 20;"

# Slow queries (cần enable slow query log)
tail -n 100 /var/log/mysql/slow.log
```

### Backup thủ công khẩn cấp

```bash
# Backup ngay lập tức
cd /var/www/website-admin/source/backend
npm run backup

# Hoặc mysqldump trực tiếp
mysqldump -u root -p --all-databases | gzip > /tmp/emergency-backup-$(date +%Y%m%d-%H%M).sql.gz
```

### Restore từ backup

```bash
# Restore một database cụ thể
mysql -u root -p game_db < /path/to/backup.sql

# Restore tất cả (dùng script)
cd source/backend
npm run restore -- --file=./backups/backup-YYYY-MM-DD.sql.gz
```

---

## 6. Performance Monitoring

### Key metrics cần theo dõi

| Metric | Ngưỡng cảnh báo | Hành động |
|--------|-----------------|-----------|
| CPU > 80% kéo dài > 5 phút | Warning | Scale PM2 instances |
| Memory > 85% | Warning | Restart PM2, kiểm tra leak |
| MySQL connections > 80% max | Warning | Tăng `max_connections` |
| Redis memory > 80% | Warning | Review eviction policy |
| Disk usage > 80% | Warning | Xóa logs cũ, cleanup |
| Error rate > 5% | Alert | Kiểm tra logs ngay |
| Response time p95 > 1s | Alert | Kiểm tra slow queries |

### Xem health system

```bash
# PM2 monitor (realtime CPU/RAM)
pm2 monit

# Node.js memory snapshot
pm2 logs kjc-api | grep health_snapshot

# Redis info
redis-cli info stats | grep -E 'total_commands|instantaneous_ops'

# MySQL connections
mysql -u root -p -e "SHOW STATUS LIKE 'Max_used_connections';"
```

---

## 7. Rolling Update (Zero-downtime)

```bash
# PM2 reload — không có downtime (cluster mode)
pm2 reload ecosystem.config.js --update-env

# Kiểm tra sau reload
pm2 status
curl http://localhost:5000/health/live

# Nếu reload fail — restart hard
pm2 restart kjc-api
```

---

## 8. User Support & Complaint Handling

### Quy trình xử lý khiếu nại

1. User gửi ticket qua hệ thống → `support_tickets` table trong admin_db
2. Admin nhận thông báo → xem tại `/api/admin/support/tickets`
3. Admin phản hồi qua hệ thống → cập nhật status: `open` → `in_progress` → `resolved`
4. SLA phản hồi: P1 < 2h, P2 < 8h, P3 < 24h

### Admin actions audit

Mọi hành động của admin (approve/reject giao dịch, thay đổi setting, khóa user) đều được ghi vào `audit_logs` với:
- `adminId` — ai thực hiện
- `action` — hành động gì
- `resource` — tác động lên đối tượng nào
- `ipAddress` — IP của admin
- `createdAt` — thời điểm

Xem audit log tại: `GET /api/admin/logs/audit`
