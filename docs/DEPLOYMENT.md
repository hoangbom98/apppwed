# Deployment Guide — LKVIP GROUP @ tc-gaming.live

Canonical deploy guide cho LKVIP. Workflow chuẩn chạy native trên VPS, không dùng Docker.

## 1. Hạ tầng production

| Thành phần | Giá trị hiện tại |
|------------|------------------|
| Project root | `/var/LKVIP` |
| System user | `lkvip` |
| Backend process | PM2 `lkvip-api` |
| Internal API | `127.0.0.1:5000` |
| Public API | `https://api.tc-gaming.live` |
| Logs | `/var/LKVIP/logs/` |
| Backups | `/var/LKVIP/.backups/` |
| Deploy script | `scripts/deploy.sh` |
| CI deploy | `.github/workflows/deploy.yml` |

Không dùng `/var/www` cho LKVIP deploy.

## 2. Public hosts hiện tại

| Host | Target |
|------|--------|
| `tc-gaming.live` | `apps/hub/dist` |
| `hub.tc-gaming.live` | `apps/hub/dist` |
| `trade.tc-gaming.live` | `apps/trading/dist` |
| `sports.tc-gaming.live` | `apps/sports/dist` |
| `admin.tc-gaming.live` | `apps/admin-dashboard/dist` |
| `api.tc-gaming.live` | proxy `127.0.0.1:5000` |

`game` và `dating` có build output nhưng chưa public DNS/Nginx trong cấu hình hiện tại. Không thêm public check cho hai app này nếu DNS/Nginx chưa được cấu hình.

## 3. First-time VPS setup

Chạy một lần bằng root:

```bash
ssh root@<VPS_HOST>
git clone <repo-url> /var/LKVIP
sudo bash /var/LKVIP/scripts/vps-setup.sh
```

Script setup chịu trách nhiệm:

- Tạo user `lkvip`.
- Cài Node.js 20, pnpm 9, PM2, MySQL 8, Redis 7, Nginx.
- Tạo 6 MySQL schemas và user DB riêng.
- Cấu hình firewall để chỉ public SSH/HTTP/HTTPS; backend port `5000` chỉ nội bộ.
- Chuẩn bị Nginx/PM2 cho LKVIP.

## 4. Environment production

```bash
sudo -u lkvip bash
cd /var/LKVIP
cp config/env/.env.example apps/backend/.env
nano apps/backend/.env
chmod 600 apps/backend/.env
```

Biến bắt buộc:

```env
NODE_ENV=production
PORT=5000
APP_URL=https://api.tc-gaming.live
CORS_ORIGINS=https://tc-gaming.live,https://www.tc-gaming.live,https://hub.tc-gaming.live,https://trade.tc-gaming.live,https://sports.tc-gaming.live,https://admin.tc-gaming.live

HUB_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/hub_db
GAME_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/game_db
TRADE_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/trade_db
DATING_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/dating_db
SPORTS_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/sports_db
ADMIN_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/admin_db

REDIS_URL=redis://127.0.0.1:6379/2
JWT_SECRET=<random-string-at-least-32-chars>
ENCRYPTION_KEY=<random-string-at-least-32-chars>
```

Không ghi secret thật vào tài liệu, issue, log, chat.

## 5. Deploy bằng script

```bash
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh
```

Script làm các bước chính:

1. Kiểm tra đúng root `/var/LKVIP`, toolchain, `.env`, port.
2. Backup uploads.
3. `git pull --ff-only origin main`.
4. `pnpm install --frozen-lockfile --prod=false`.
5. Prisma migrate deploy cho 6 schemas.
6. Build backend.
7. Build frontends.
8. Reload/start PM2 `lkvip-api`.
9. Reload Nginx nếu config hợp lệ.
10. Health/public URL checks.

Tuỳ chọn:

```bash
bash scripts/deploy.sh --backend-only
bash scripts/deploy.sh --frontend-only
bash scripts/deploy.sh --skip-build
bash scripts/deploy.sh --skip-backup
```

## 6. Deploy bằng GitHub Actions

Workflow: `.github/workflows/deploy.yml`.

Trigger:

- Push vào `main` khi file liên quan thay đổi.
- Manual `workflow_dispatch` với confirm `deploy`.

Secrets cần có:

| Secret | Mô tả |
|--------|------|
| `VPS_HOST` | Host/IP VPS |
| `VPS_USER` | User deploy, thường là `lkvip` |
| `VPS_SSH_KEY` | Private SSH key cho user deploy |
| `VPS_PORT` | SSH port, default 22 |

CI phải pass trước deploy.

## 7. Health checks

Backend internal:

```bash
curl -sf http://127.0.0.1:5000/health
```

Deploy chỉ pass khi JSON có:

```json
{"status":"healthy"}
```

Public checks hiện tại:

```bash
curl -fsSIL https://tc-gaming.live/
curl -fsSIL https://hub.tc-gaming.live/
curl -fsSIL https://trade.tc-gaming.live/
curl -fsSIL https://sports.tc-gaming.live/
curl -fsSIL https://admin.tc-gaming.live/
curl -fsS https://api.tc-gaming.live/health
curl -fsS "https://api.tc-gaming.live/api/shared/config?project=hub&group=brand"
curl -fsS "https://api.tc-gaming.live/api/shared/config?project=hub&group=colors"
```

## 8. PM2 operations

```bash
pm2 status
pm2 logs lkvip-api --lines 100
pm2 monit
pm2 reload lkvip-api --update-env
pm2 restart lkvip-api
pm2 save
```

`reload` là ưu tiên cho zero-downtime. Dùng `restart` khi reload không phù hợp.

## 9. Nginx operations

Config trong repo: `config/nginx/tc-gaming.conf`.

Trên VPS, symlink/copy sang Nginx sites-enabled theo setup script.

```bash
nginx -t
systemctl reload nginx
```

Không expose trực tiếp port `5000`, MySQL, Redis ra public.

## 10. Rollback

`scripts/deploy.sh` có rollback cơ bản về commit trước nếu lỗi xảy ra trong vùng deploy được script quản lý.

Nếu cần xử lý thủ công:

```bash
cd /var/LKVIP
git log --oneline -5
# Chỉ rollback khi đã xác nhận phạm vi ảnh hưởng.
pm2 logs lkvip-api --lines 100
```

Tránh `git reset --hard`, `git clean`, xóa file, hoặc force push nếu chưa xác nhận rõ.

## 11. Sau deploy

- Đổi mật khẩu seed/default trước production.
- Kiểm tra admin `/config/general` nếu thay đổi theme config.
- Kiểm tra public config API không trả secret.
- Theo dõi PM2 logs, Nginx logs, MySQL/Redis health.
- Nếu public game/dating cần bật, làm task riêng: DNS, SSL, Nginx server blocks, deploy checks.
