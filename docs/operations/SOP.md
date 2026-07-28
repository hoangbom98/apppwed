# SOP — Standard Operating Procedures · LKVIP GROUP

> Domain: `tc-gaming.live` | Root: `/var/LKVIP` | PM2: `lkvip-api` | API: `https://api.tc-gaming.live`

---

## 1. Kiểm tra trạng thái hệ thống

```bash
# Tổng quan nhanh
pm2 status
systemctl status nginx --no-pager
redis-cli ping                          # phải trả về PONG
mysqladmin ping -u root -p              # phải trả về mysqld is alive
curl -s https://api.tc-gaming.live/health | python3 -m json.tool
```

---

## 2. Deploy lên production

```bash
# Zero-downtime deploy chuẩn
cd /var/LKVIP
sudo -u lkvip bash scripts/deploy.sh

# Hoặc thủ công từng bước:
git pull origin main
pnpm install --frozen-lockfile
pnpm run build:all
pnpm run prisma:deploy          # chạy migrate deploy cho 6 schemas
pm2 reload lkvip-api --update-env
nginx -t && nginx -s reload
```

**Thứ tự migrate bắt buộc**: `admin` → `hub` → `game` → `dating` → `trade` → `sports`

```bash
# Migrate từng schema riêng lẻ nếu cần
cd apps/backend
npx tsx ../../scripts/prisma-run.ts migrate admin
npx tsx ../../scripts/prisma-run.ts migrate hub
```

---

## 3. Rollback

```bash
# Rollback 1 commit
bash scripts/rollback.sh

# Rollback về tag cụ thể
bash scripts/rollback.sh v1.2.3
```

---

## 4. Xem logs

```bash
# Logs realtime
pm2 logs lkvip-api --lines 100

# Logs lỗi
pm2 logs lkvip-api --err --lines 50
tail -f /var/LKVIP/logs/lkvip-api-err.log

# Nginx access/error logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 5. Khởi động lại services

```bash
# Backend (zero-downtime)
pm2 reload lkvip-api --update-env

# Hard restart (khi cần load lại env)
pm2 restart lkvip-api --update-env

# Nginx
nginx -t && systemctl reload nginx

# Redis
systemctl restart redis-server

# MySQL
systemctl restart mysql
```

---

## 6. SSL / Certificates

```bash
# Renew cert (Certbot tự gia hạn qua cron, nhưng có thể force)
certbot renew --nginx --quiet

# Kiểm tra hạn cert
echo | openssl s_client -connect api.tc-gaming.live:443 2>/dev/null | openssl x509 -noout -dates

# Cert cho tất cả subdomain (chạy 1 lần khi cần thêm domain)
certbot --nginx -d tc-gaming.live \
  -d hub.tc-gaming.live -d api.tc-gaming.live \
  -d trade.tc-gaming.live -d sports.tc-gaming.live \
  -d game.tc-gaming.live -d admin.tc-gaming.live
```

---

## 7. Database operations

```bash
# Backup thủ công
mysqldump -u root -p --all-databases > /tmp/lkvip-backup-$(date +%Y%m%d).sql

# Kết nối MySQL
mysql -u root -p

# Xem kích thước các databases
mysql -u root -p -e "SELECT table_schema, ROUND(SUM(data_length+index_length)/1024/1024,2) AS 'MB' FROM information_schema.tables GROUP BY table_schema ORDER BY 2 DESC;"
```

---

## 8. Dọn dẹp định kỳ

```bash
# Xóa PM2 logs cũ (> 30 ngày)
pm2 flush

# Xóa Prisma query cache
find /var/LKVIP -name "*.tmp" -mtime +7 -delete

# Cleanup script project
node /var/LKVIP/scripts/cleanup.mjs    # dry-run
node /var/LKVIP/scripts/cleanup.mjs --run
```

---

## 9. Xử lý sự cố nhanh

| Triệu chứng | Lệnh kiểm tra | Fix |
|---|---|---|
| API 502 Bad Gateway | `pm2 status` | `pm2 restart lkvip-api` |
| API 504 Timeout | `pm2 logs lkvip-api --err` | Kiểm tra DB connection |
| Redis lỗi | `redis-cli ping` | `systemctl restart redis-server` |
| MySQL lỗi | `mysqladmin ping -u root -p` | `systemctl restart mysql` |
| Nginx 403/404 | `nginx -t` | Kiểm tra `config/nginx/tc-gaming.conf` |
| Disk full | `df -h` | Dọn logs: `pm2 flush && journalctl --vacuum-time=7d` |

---

## 10. Contacts & Escalation

- **Telegram Alert**: cấu hình trong `apps/backend/.env` → `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- **Sentry**: dashboard tại `sentry.io` → project `lkvip-backend`
- **Xem chi tiết incident**: [`docs/INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md)
