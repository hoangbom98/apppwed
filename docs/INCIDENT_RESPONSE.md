# Incident Response Plan — LKVIP Group

> Runbook ứng phó sự cố cho hệ thống production `tc-gaming.live`.
> Cập nhật cùng mọi thay đổi về hạ tầng hoặc quy trình vận hành.

---

## 1. Mức độ sự cố (Severity Levels)

| Cấp | Mô tả | SLA phản hồi | Kênh liên lạc |
|-----|-------|-------------|---------------|
| **P1** — Critical | Production hoàn toàn không truy cập được, API/DB unreachable, mất tiền người dùng | **< 15 phút** | Telegram group kỹ thuật + gọi trực tiếp |
| **P2** — High | Chức năng chính lỗi: login, nạp tiền, rút tiền, admin deploy | **< 1 giờ** | Telegram group kỹ thuật |
| **P3** — Medium | Lỗi một phần, chậm, tính năng phụ không hoạt động | **< 4 giờ** | Telegram kỹ thuật / GitHub issue |
| **P4** — Low | Typo, lỗi UI nhỏ, cải tiến docs | **< 1 ngày** | GitHub issue |

---

## 2. Người chịu trách nhiệm (On-Call)

| Vai trò | Trách nhiệm |
|---------|-------------|
| **Tech Lead** | Quyết định rollback, escalation lên management |
| **Backend On-call** | Điều tra API/DB/PM2, deploy hotfix |
| **DevOps On-call** | VPS, Nginx, SSL, firewall |
| **Manager** | Thông báo cho người dùng nếu downtime > 30 phút |

> Liên hệ khẩn cấp và thông tin cụ thể lưu trong kênh Telegram nội bộ (không lưu trong repo).

---

## 3. Quy trình ứng phó P1 — Production Down

### Bước 1: Xác nhận sự cố (< 5 phút)

```bash
# SSH vào VPS
ssh lkvip@104.248.146.203

# Kiểm tra PM2 process
pm2 status

# Kiểm tra health endpoint nội bộ
curl -sf http://127.0.0.1:5000/health

# Kiểm tra tài nguyên hệ thống
free -h && df -h && uptime

# Kiểm tra MySQL
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Kiểm tra Redis
redis-cli ping

# Kiểm tra Nginx
nginx -t && systemctl status nginx
```

### Bước 2: Cô lập (< 10 phút)

```bash
# Nếu nghi ngờ bị tấn công — block IP ngay
sudo ufw deny from <ATTACKER_IP> to any

# Nếu DB bị quá tải — tạm thời giới hạn kết nối
mysql -u root -p -e "SET GLOBAL max_connections = 50;"

# Xem log lỗi gần nhất
pm2 logs lkvip-api --lines 200
tail -n 100 /var/log/nginx/error.log
```

### Bước 3: Điều tra nguyên nhân gốc rễ

```bash
# Kiểm tra PM2 đã exit chưa
pm2 list
pm2 logs lkvip-api --err --lines 100

# Kiểm tra disk full
df -h

# Kiểm tra OOM killer
dmesg | grep -i "killed process" | tail -20

# Kiểm tra slow query (nếu DB chậm)
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SELECT * FROM information_schema.INNODB_TRX;"

# Kiểm tra Redis memory
redis-cli info memory | grep used_memory_human
```

### Bước 4: Khắc phục

**Trường hợp A: Backend crash / PM2 stopped**
```bash
cd /var/LKVIP
pm2 reload lkvip-api --update-env
pm2 save
# Verify
sleep 5 && curl -sf http://127.0.0.1:5000/health
```

**Trường hợp B: Deploy lỗi — rollback code**
```bash
cd /var/LKVIP
git log --oneline -10        # tìm commit trước đó
PREV_COMMIT="abc1234"        # commit ổn định cuối cùng
git checkout "$PREV_COMMIT" -- apps/backend/dist/
pm2 reload lkvip-api --update-env
```

**Trường hợp C: DB migration lỗi**
```bash
# Kiểm tra trạng thái migration
cd /var/LKVIP/apps/backend
npx prisma migrate status --schema prisma/admin/schema.prisma
# Nếu cần: resolve migration thủ công
npx prisma migrate resolve --rolled-back <MIGRATION_NAME> \
  --schema prisma/admin/schema.prisma
```

**Trường hợp D: Disk full**
```bash
# Xem file lớn nhất
du -sh /var/LKVIP/logs/* | sort -rh | head -20
# Nén log cũ
gzip /var/LKVIP/logs/lkvip-api-out.log.1
# Xóa backup > 7 ngày
find /var/LKVIP/.backups -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
```

### Bước 5: Verify sau fix

```bash
# Health check nội bộ
curl -sf http://127.0.0.1:5000/health | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print('OK' if d['status']=='healthy' else 'FAIL')"

# Kiểm tra public endpoints
curl -fsSIL https://tc-gaming.live/
curl -fsSIL https://api.tc-gaming.live/health

# Theo dõi error rate 5 phút
pm2 logs lkvip-api --lines 50
```

### Bước 6: Thông báo & Post-mortem

1. **Thông báo người dùng** (nếu downtime > 30 phút) — qua admin module Announcement
2. **Ghi lại incident** tại `docs/incidents/YYYY-MM-DD-<mô-tả>.md`
3. **Post-mortem** trong vòng 48 giờ: nguyên nhân, timeline, hành động khắc phục, biện pháp phòng ngừa

---

## 4. Quy trình ứng phó P2 — Chức năng chính lỗi

### Lỗi nạp/rút tiền

```bash
# Kiểm tra worker BullMQ
pm2 logs lkvip-api | grep -i "withdraw\|deposit\|worker"

# Kiểm tra bảng pending
mysql -u root -p lkvip_admin -e \
  "SELECT status, COUNT(*) FROM deposit_orders GROUP BY status;"
mysql -u root -p lkvip_admin -e \
  "SELECT status, COUNT(*) FROM withdraw_orders \
   WHERE createdAt > DATE_SUB(NOW(), INTERVAL 2 HOUR) GROUP BY status;"
```

### Lỗi login / JWT

```bash
# Kiểm tra JWT secret đang dùng
pm2 env lkvip-api | grep JWT

# Kiểm tra Redis session
redis-cli keys "sess:*" | wc -l
redis-cli dbsize
```

### Lỗi game API (GSC/Goldgate/TCGaming)

```bash
# Kiểm tra outbound call log
mysql -u root -p lkvip_admin -e \
  "SELECT providerCode, success, COUNT(*) FROM third_party_call_logs \
   WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR) \
   GROUP BY providerCode, success;"
```

---

## 5. Security Incident — Bị tấn công

### Dấu hiệu nhận biết

- Log rate đột biến bất thường
- Nhiều lỗi 401/403 từ cùng một IP
- CPU/memory tăng đột ngột không giải thích được
- Tài khoản admin đăng nhập từ IP lạ
- `security_logs` ghi nhiều event `ip_blocked` liên tiếp

### Hành động khẩn cấp

```bash
# 1. Block IP tấn công ngay
sudo ufw deny from <ATTACKER_IP> to any
sudo ufw status

# 2. Revoke tất cả session của user bị compromise
mysql -u root -p lkvip_admin -e \
  "UPDATE user_sessions SET isRevoked=1 WHERE userId='<USER_ID>';"

# 3. Nếu nghi admin account bị lấy — đổi password ngay + disable 2FA cũ
# (qua admin panel với tài khoản super_admin khác)

# 4. Rotate JWT secret (sẽ invalidate TẤT CẢ sessions hiện tại)
# Sửa JWT_SECRET trong .env, reload PM2
pm2 reload lkvip-api --update-env

# 5. Kiểm tra audit log
mysql -u root -p lkvip_admin -e \
  "SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 50;"
mysql -u root -p lkvip_admin -e \
  "SELECT * FROM security_logs WHERE severity='critical' \
   ORDER BY createdAt DESC LIMIT 50;"
```

### Thông báo bắt buộc

- Nếu dữ liệu người dùng bị lộ: thông báo người dùng và cơ quan có thẩm quyền trong vòng 72 giờ (PDPA/GDPR).
- Lưu toàn bộ log incident vào file riêng trước khi xóa/rotate.

---

## 6. Template Post-Mortem

Tạo file `docs/incidents/YYYY-MM-DD-<slug>.md` với nội dung:

```markdown
# Incident: <tiêu đề ngắn>
Date: YYYY-MM-DD HH:MM — HH:MM (UTC+7)
Severity: P1 / P2 / P3
Duration: X phút / giờ
Author: <tên người viết>

## Tóm tắt
<1-2 câu mô tả sự cố>

## Timeline
- HH:MM — Phát hiện / cảnh báo từ ...
- HH:MM — Bắt đầu điều tra
- HH:MM — Xác định nguyên nhân: ...
- HH:MM — Áp dụng fix: ...
- HH:MM — Verify resolved

## Nguyên nhân gốc rễ (Root Cause)
<Mô tả chi tiết>

## Tác động
- Số người dùng ảnh hưởng: ~X
- Dữ liệu bị mất/sai: có / không
- Giao dịch bị ảnh hưởng: X giao dịch

## Hành động khắc phục (đã làm)
- [ ] ...

## Hành động phòng ngừa (cần làm)
- [ ] ...

## Bài học rút ra
...
```

---

## 7. Kênh liên lạc khẩn cấp

> Thông tin cụ thể (số điện thoại, Telegram handle, chat ID) được lưu trong Telegram group nội bộ kỹ thuật — không lưu trong repo.

| Kênh | Dùng khi |
|------|----------|
| Telegram group kỹ thuật | Mọi P1/P2 |
| Gọi trực tiếp Tech Lead | P1 không phản hồi sau 10 phút |
| GitHub Issue (label `incident`) | P3/P4, sau khi đã xử lý |

---

## 8. Checklist trước khi đóng incident

- [ ] Root cause đã xác định rõ ràng
- [ ] Fix đã được verify trên production
- [ ] Người dùng bị ảnh hưởng đã được thông báo (nếu cần)
- [ ] Post-mortem đã được tạo tại `docs/incidents/`
- [ ] Biện pháp phòng ngừa đã được tạo thành task (GitHub issue / ClickUp)
- [ ] Backup và log đã được lưu trữ an toàn
- [ ] Monitoring alert đã được kiểm tra lại để đảm bảo phát hiện sớm hơn lần sau
