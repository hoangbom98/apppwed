# Operations Guide — LKVIP

Runbook vận hành production trên VPS native. Không dùng Docker.

## 1. Mục tiêu vận hành

| Metric | Target |
|--------|--------|
| Uptime production | 99.9% |
| API p95 | < 500ms |
| Health/login p95 | < 200ms |
| RTO | < 4 giờ |
| RPO | < 24 giờ |
| Backup | Hàng ngày, giữ theo policy hiện hành |

## 2. Incident severity

| Cấp độ | Mô tả | Response |
|--------|-------|----------|
| P1 | Production down, API/DB unreachable | < 15 phút |
| P2 | Chức năng chính lỗi: login/payment/config/deploy | < 1 giờ |
| P3 | Chậm, lỗi một phần, regression nhỏ | < 4 giờ |
| P4 | Typo/cosmetic/docs | < 1 ngày |

## 3. P1 checklist

```bash
pm2 status
pm2 logs lkvip-api --lines 100
free -h
df -h
ss -tlnp
redis-cli ping
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
curl -sf http://127.0.0.1:5000/health
```

Nếu backend không healthy:

```bash
pm2 reload lkvip-api --update-env
pm2 logs lkvip-api --lines 100
```

Trước mọi rollback/destructive git command, kiểm tra trạng thái và xác nhận phạm vi ảnh hưởng.

## 4. Logs

| Log | Vị trí |
|-----|--------|
| PM2 app | `pm2 logs lkvip-api` |
| Project logs | `/var/LKVIP/logs/` |
| Nginx access/error | `/var/log/nginx/` |
| MySQL slow log | `/var/log/mysql/` nếu bật |
| Admin audit | `admin_db.audit_logs` |
| Security logs | `admin_db.security_logs` |

Lệnh thường dùng:

```bash
pm2 logs lkvip-api --lines 100
pm2 monit
tail -f /var/LKVIP/logs/lkvip-api-out.log
```

## 5. Health và metrics

```bash
curl -sf http://127.0.0.1:5000/health
curl -sf https://api.tc-gaming.live/health
curl -sf http://127.0.0.1:5000/metrics
```

Health deploy chỉ OK khi JSON có `status: "healthy"`.

## 6. Database maintenance

```bash
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Max_used_connections';"
```

Schema paths:

```text
apps/backend/prisma/hub/schema.prisma
apps/backend/prisma/game/schema.prisma
apps/backend/prisma/trade/schema.prisma
apps/backend/prisma/dating/schema.prisma
apps/backend/prisma/sports/schema.prisma
apps/backend/prisma/admin/schema.prisma
```

Migrations production:

```bash
pnpm prisma:deploy
```

Không dùng `prisma db push` trên staging/production.

## 7. Deploy operations

Canonical deploy docs: `docs/DEPLOYMENT.md`.

```bash
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --backend-only
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --frontend-only
```

Sau deploy:

```bash
pm2 status
curl -sf https://api.tc-gaming.live/health
curl -fsSIL https://admin.tc-gaming.live/
```

## 8. Monitoring thresholds

| Metric | Cảnh báo | Hành động |
|--------|----------|-----------|
| CPU > 80% kéo dài | Warning | Xem PM2/top, kiểm tra traffic |
| Memory > 85% | Warning | Kiểm tra leak/OOM, PM2 memory restart |
| Disk > 80% | Warning | Dọn logs/cache/backups cũ an toàn |
| MySQL connections > 80% max | Warning | Xem slow query/pool |
| Redis memory > 80% | Warning | Review cache/queue |
| Error rate > 5% | Alert | Xem PM2/Nginx/backend logs |
| p95 > 1s | Alert | Xem DB latency, cache, external APIs |

## 9. Security operations

- Không paste secret thật vào logs/docs/chat.
- `.env` production chmod `600`.
- Không expose MySQL/Redis/backend port trực tiếp public.
- Public config API chỉ trả non-secret config.
- Khi đổi CORS/domain/deploy health, cập nhật `docs/DEPLOYMENT.md`.

## 10. Backup & Restore

```bash
# Chạy backup thủ công (chạy như user lkvip)
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh

# Test khả năng restore từ backup gần nhất (không ảnh hưởng production)
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh --restore-test

# Xem log backup
tail -50 /var/LKVIP/logs/backup.log
```

Crontab backup tự động (`sudo -u lkvip crontab -l`):

```text
0 2 * * *   bash /var/LKVIP/scripts/backup.sh >> /var/LKVIP/logs/backup.log 2>&1
0 3 * * 0   bash /var/LKVIP/scripts/backup.sh --restore-test >> /var/LKVIP/logs/backup.log 2>&1
```

Backup lưu tại `/var/LKVIP/.backups/<YYYY-MM-DD>/`, giữ 7 ngày. Thông báo qua Telegram khi backup hoàn tất hoặc thất bại (cần `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ALERT_CHAT_ID` trong `.env`).

## 11. Incident Response

Khi có sự cố production, làm theo `docs/INCIDENT_RESPONSE.md`.

## 12. Support và audit

Admin actions cần có audit trail trong `admin_db.audit_logs`. Support tickets/complaints xử lý qua admin module nếu tính năng tương ứng đang bật.
