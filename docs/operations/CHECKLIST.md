# Checklist Vận Hành · LKVIP GROUP

---

## ☀️ Kiểm tra sáng (08:00)

```bash
pm2 status                                     # tất cả online?
curl -s https://api.tc-gaming.live/health      # status: healthy?
redis-cli ping                                 # PONG?
```

- [ ] PM2 `lkvip-api` — trạng thái `online`, restart count = 0
- [ ] `https://api.tc-gaming.live/health` — `status: healthy`
- [ ] `https://hub.tc-gaming.live` — load được
- [ ] `https://trade.tc-gaming.live` — load được
- [ ] `https://admin.tc-gaming.live` — load được
- [ ] Redis — `redis-cli ping` trả về `PONG`
- [ ] MySQL — `mysqladmin ping` trả về `alive`
- [ ] Nginx — không có lỗi 5xx trong `access.log` đêm qua
- [ ] Sentry — không có critical error mới
- [ ] Disk usage — `df -h /var/LKVIP` dưới 80%

---

## 🌆 Kiểm tra chiều (14:00)

```bash
pm2 logs lkvip-api --err --lines 50 --nostream
df -h /var/LKVIP
```

- [ ] Không có error spike bất thường trong logs
- [ ] Memory usage PM2 dưới `400M` (threshold restart)
- [ ] Không có slow query cảnh báo trong MySQL
- [ ] Backup DB đêm qua đã chạy thành công

---

## 🌙 Kiểm tra tối (22:00)

```bash
ls -la /var/LKVIP/logs/                        # backup log files
pm2 status
```

- [ ] Backup database đêm nay đã được schedule
- [ ] Không có alert nào từ monitoring
- [ ] SSL cert còn hạn > 30 ngày: `certbot certificates`
- [ ] pnpm lockfile không bị uncommitted thay đổi

---

## 🚀 Checklist trước khi deploy

```bash
bash scripts/pre-prod-check.sh
```

- [ ] TypeScript build sạch: `cd apps/backend && npx tsc --noEmit`
- [ ] Tests pass: `pnpm run test:all 2>/dev/null || echo "skip"`
- [ ] Không có migration chưa chạy: `git status prisma/`
- [ ] `.env` production đã cập nhật nếu có env mới
- [ ] `pnpm run build:all` thành công trên nhánh deploy
- [ ] PR đã được review và approve
- [ ] Backup database thủ công trước deploy lớn

---

## 🔄 Checklist sau khi deploy

```bash
curl -s https://api.tc-gaming.live/health
pm2 status
pm2 logs lkvip-api --lines 20 --nostream
```

- [ ] API health check trả về `healthy`
- [ ] PM2 không có crash sau deploy
- [ ] Không có 5xx spike trong Nginx logs (chờ 5 phút)
- [ ] Kiểm tra trang chủ các subdomain chính
- [ ] Sentry không có new error burst

---

## 🛑 Checklist khi có sự cố

1. **Xác định phạm vi**: backend / nginx / database / redis / network?
2. **Thu thập log**: `pm2 logs lkvip-api --err --lines 100`
3. **Kiểm tra health**: `curl -s https://api.tc-gaming.live/health`
4. **Quyết định rollback hay fix forward**
5. **Notify team qua Telegram**
6. **Ghi incident report** theo template tại [`docs/INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md)

---

## 📋 Checklist thêm dự án mới vào LKVIP

- [ ] Clone vào `external/<name>/` (không phải `apps/`)
- [ ] Phân tích stack và viết `external/<name>/LKVIP_ANALYSIS.md`
- [ ] Thiết kế schema Prisma đúng chuẩn (DECIMAL(19,4), referenceId @unique, Timestamp(6))
- [ ] Chạy migration: `npx tsx scripts/prisma-run.ts migrate <module>`
- [ ] Tạo service + controller + validator (Joi) + routes
- [ ] Thêm vào `CLAUDE.md` phần nhiệm vụ tích hợp
- [ ] TypeScript check: `cd apps/backend && npx tsc --noEmit` → 0 errors
- [ ] Frontend: Tailwind v4 + Lucide React + TanStack Query + React Router v7
- [ ] OXLint: `cd apps/<spa> && npx oxlint src`
