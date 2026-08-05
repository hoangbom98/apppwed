# Hướng dẫn Deploy — `academy.tc-gaming.live`

> **Monorepo:** `/var/LKVIP` · **VPS IP:** `104.248.146.203` · **OS:** Ubuntu 22.04
> **App:** `@lkvip/academy` · Next.js 15 standalone · Port nội bộ: `:3013`
> **PM2 process:** `lkvip-academy` · **Nginx config:** `config/nginx/tc-gaming.conf`

---

## Phần 1 — Chuẩn bị môi trường

### 1.1 — SSH vào VPS và di chuyển đến thư mục dự án

```bash
ssh root@104.248.146.203
cd /var/LKVIP
```

### 1.2 — Kiểm tra phiên bản công cụ

```bash
node -v        # Yêu cầu: v20.x trở lên
pnpm -v        # Yêu cầu: v9.x trở lên
pm2 -v         # Yêu cầu: v5.x trở lên
nginx -v       # Xác nhận nginx đang cài
```

### 1.3 — Kiểm tra port `:3013` chưa bị chiếm

```bash
ss -tlnp | grep 3013
```

Nếu có output (port đang bị chiếm), kiểm tra process nào đang dùng:

```bash
lsof -i :3013
```

Nếu là process cũ của `lkvip-academy`, dừng lại trước:

```bash
pm2 stop lkvip-academy 2>/dev/null || true
```

### 1.4 — Tạo file `.env.production` cho Academy (chỉ cần làm lần đầu)

```bash
# Kiểm tra file đã tồn tại chưa
ls -la apps/academy/.env.production

# Nếu chưa có, tạo mới:
cat > apps/academy/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://api.tc-gaming.live
NEXT_PUBLIC_APP_URL=https://academy.tc-gaming.live
NODE_ENV=production
EOF

# Xác nhận nội dung
cat apps/academy/.env.production
```

---

## Phần 2 — Build ứng dụng

### 2.1 — Pull code mới nhất

```bash
git pull origin main
```

### 2.2 — Cài dependencies cho toàn bộ workspace

```bash
pnpm install --frozen-lockfile
```

### 2.3 — Build các shared packages trước (bắt buộc)

```bash
# Packages phải được build trước để Academy import được
pnpm run build:packages
```

### 2.4 — Build Academy app

```bash
pnpm --filter @lkvip/academy run build
```

Quá trình build sẽ mất khoảng 1–3 phút. Kết quả mong đợi ở cuối output:

```
✓ Compiled successfully
Route (app) ...
...
```

### 2.5 — Xác nhận thư mục `standalone` được tạo ra

```bash
ls -la apps/academy/.next/standalone/
```

Phải thấy file `server.js` trong thư mục này:

```bash
ls apps/academy/.next/standalone/server.js
# → apps/academy/.next/standalone/server.js
```

> Nếu không thấy thư mục `standalone/`, kiểm tra lại `apps/academy/next.config.ts` có dòng `output: "standalone"` chưa.

---

## Phần 3 — Cấp quyền thực thi cho start script

```bash
chmod +x apps/academy/start-academy.sh
```

Xác nhận quyền đã được cấp:

```bash
ls -la apps/academy/start-academy.sh
# → -rwxr-xr-x ...
```

Xem nội dung start script để xác nhận biến môi trường:

```bash
cat apps/academy/start-academy.sh
```

Output mong đợi:
```bash
#!/bin/bash
export PORT="${PORT:-3013}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.tc-gaming.live}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://academy.tc-gaming.live}"

exec node /var/LKVIP/apps/academy/.next/standalone/server.js
```

---

## Phần 4 — Copy static assets ⚠️ Quan trọng

> **Tại sao cần bước này?**
> Next.js `output: "standalone"` chỉ đóng gói code Node.js cần thiết để chạy server, nhưng **không** tự động copy thư mục `public/` (hình ảnh, font, favicon…) và `.next/static/` (JS/CSS bundle đã hash) vào thư mục standalone. Nếu bỏ qua bước này, tất cả static assets sẽ trả về **404** khi người dùng truy cập.
>
> **Bước này phải thực hiện lại sau MỖI LẦN build.**

```bash
# Copy thư mục public/ (favicon, hình ảnh tĩnh, robots.txt...)
cp -r apps/academy/public apps/academy/.next/standalone/public

# Copy thư mục .next/static/ (JS chunk, CSS, hình ảnh đã tối ưu...)
cp -r apps/academy/.next/static apps/academy/.next/standalone/.next/static
```

Xác nhận các thư mục đã được copy:

```bash
ls apps/academy/.next/standalone/public/
ls apps/academy/.next/standalone/.next/static/
```

---

## Phần 5 — Cấu hình SSL cert ⚠️ Quan trọng

> **Tại sao cần bước này?**
> Academy dùng **cert SSL chung** cùng với tất cả subdomain khác của `tc-gaming.live` — cert này hiện đang lưu tại `/etc/letsencrypt/live/tc-gaming.live/`. Khi chạy `certbot --expand`, bạn phải liệt kê lại **toàn bộ tất cả domain** (cả cũ lẫn mới) trong một lệnh duy nhất. Nếu thiếu bất kỳ domain nào trong danh sách, certbot sẽ **xóa** domain đó khỏi cert — khiến HTTPS của domain đó bị lỗi ngay lập tức.

### 5.1 — Kiểm tra cert hiện tại đang cover những domain nào

```bash
certbot certificates
```

Xác nhận bạn thấy cert `tc-gaming.live` và danh sách domains của nó trước khi expand.

### 5.2 — Đảm bảo DNS `academy.tc-gaming.live` đã trỏ về IP VPS

```bash
dig academy.tc-gaming.live +short
# Phải trả về: 104.248.146.203
```

> Nếu chưa trỏ đúng, **không chạy certbot**. Certbot sẽ fail và có thể ảnh hưởng đến cert hiện tại. Trỏ DNS trước, chờ propagation (5–30 phút), rồi mới chạy.

### 5.3 — Expand cert — thêm `academy.tc-gaming.live`

Lệnh dưới đây liệt kê đủ 14 domain (13 cũ + 1 mới):

```bash
certbot --nginx --expand \
  -d tc-gaming.live \
  -d www.tc-gaming.live \
  -d hub.tc-gaming.live \
  -d api.tc-gaming.live \
  -d trade.tc-gaming.live \
  -d sports.tc-gaming.live \
  -d dating.tc-gaming.live \
  -d game.tc-gaming.live \
  -d admin.tc-gaming.live \
  -d lkvip.tc-gaming.live \
  -d banking.tc-gaming.live \
  -d invest.tc-gaming.live \
  -d store.tc-gaming.live \
  -d academy.tc-gaming.live
```

Kết quả mong đợi:

```
Congratulations! Your certificate and chain have been saved at:
/etc/letsencrypt/live/tc-gaming.live/fullchain.pem
```

### 5.4 — Kiểm tra auto-renewal

```bash
systemctl status certbot.timer
certbot renew --dry-run
```

---

## Phần 6 — Reload Nginx

Nginx config cho `academy.tc-gaming.live` đã được định nghĩa trong `config/nginx/tc-gaming.conf` (upstream `lkvip_academy` → `127.0.0.1:3013`, đã có server block HTTP và HTTPS). Chỉ cần reload:

```bash
# Kiểm tra syntax trước
nginx -t
```

Output mong đợi:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

```bash
# Reload zero-downtime
systemctl reload nginx
```

---

## Phần 7 — Start hoặc Reload PM2

> PM2 entry `lkvip-academy` đã được khai báo trong `config/pm2/ecosystem.config.js` với script `apps/academy/start-academy.sh`.

### Trường hợp A — Lần đầu tiên deploy (process chưa tồn tại trong PM2)

```bash
pm2 start config/pm2/ecosystem.config.js --only lkvip-academy --env production
```

### Trường hợp B — Các lần deploy tiếp theo (process đã tồn tại)

```bash
pm2 reload config/pm2/ecosystem.config.js --only lkvip-academy --update-env
```

> `--update-env` đảm bảo PM2 đọc lại các biến môi trường mới nhất từ ecosystem config, không dùng cache từ lần start trước.

### Lưu danh sách process (bắt buộc sau lần đầu start)

```bash
pm2 save
```

> Lệnh này ghi danh sách process vào `~/.pm2/dump.pm2`. Khi VPS reboot, PM2 sẽ tự khởi động lại `lkvip-academy` mà không cần can thiệp thủ công (yêu cầu `pm2 startup` đã được chạy từ trước).

---

## Phần 8 — Kiểm tra sau deploy

### 8.1 — Kiểm tra PM2 process đang chạy

```bash
pm2 status
```

Tìm dòng `lkvip-academy` — cột `status` phải là `online`:

```
┌──────────────────┬────┬───────────┬──────┬────────┐
│ name             │ id │ status    │ cpu  │ memory │
├──────────────────┼────┼───────────┼──────┼────────┤
│ lkvip-academy    │ X  │ online    │ 0%   │ ~90MB  │
└──────────────────┴────┴───────────┴──────┴────────┘
```

### 8.2 — Xem logs để xác nhận server đã khởi động thành công

```bash
pm2 logs lkvip-academy --lines 50
```

Tìm dòng tương tự:
```
▶ Ready on http://127.0.0.1:3013
```

Xem log lỗi riêng nếu cần:

```bash
tail -f /var/LKVIP/data/logs/lkvip-academy-err.log
```

### 8.3 — Test kết nối nội bộ (từ VPS)

```bash
# Test trực tiếp port 3013 (không qua nginx)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3013
# Mong đợi: 200
```

### 8.4 — Test qua Nginx + SSL (public endpoint)

```bash
# Kiểm tra HTTPS trả về 200
curl -I https://academy.tc-gaming.live
# Mong đợi: HTTP/2 200

# Kiểm tra HTTP redirect sang HTTPS
curl -I http://academy.tc-gaming.live
# Mong đợi: HTTP/1.1 301 Moved Permanently + Location: https://academy.tc-gaming.live/

# Kiểm tra SSL cert hợp lệ và expiry
echo | openssl s_client -connect academy.tc-gaming.live:443 -servername academy.tc-gaming.live 2>/dev/null \
  | openssl x509 -noout -subject -dates
```

---

## Phần 9 — Rollback nếu có lỗi

### 9.1 — Dừng process Academy ngay lập tức

```bash
pm2 stop lkvip-academy
```

### 9.2 — Kiểm tra log để tìm nguyên nhân lỗi

```bash
# Xem toàn bộ log gần nhất
pm2 logs lkvip-academy --lines 100 --nostream

# Xem log lỗi chi tiết
cat /var/LKVIP/data/logs/lkvip-academy-err.log | tail -50

# Xem log output
cat /var/LKVIP/data/logs/lkvip-academy-out.log | tail -50
```

### 9.3 — Các nguyên nhân lỗi thường gặp và cách xử lý

| Triệu chứng | Nguyên nhân | Xử lý |
|---|---|---|
| `Cannot find module '/var/LKVIP/apps/academy/.next/standalone/server.js'` | Chưa build hoặc build lỗi | Chạy lại Phần 2 |
| Trang load nhưng static assets 404 | Quên copy `public/` và `.next/static/` | Chạy lại Phần 4 |
| `EADDRINUSE: address already in use :::3013` | Port đang bị process khác chiếm | `lsof -i :3013` rồi kill process |
| `502 Bad Gateway` từ nginx | PM2 process chưa start hoặc đã crash | Kiểm tra `pm2 status` và logs |
| SSL error / `certificate verify failed` | DNS chưa propagate khi chạy certbot | Kiểm tra DNS rồi chạy lại Phần 5 |

### 9.4 — Rollback về commit trước

```bash
# Xem lịch sử commit
git log --oneline -10

# Rollback file academy về commit cụ thể
git checkout <commit-hash> -- apps/academy/

# Rebuild và reload
pnpm --filter @lkvip/academy run build

cp -r apps/academy/public apps/academy/.next/standalone/public
cp -r apps/academy/.next/static apps/academy/.next/standalone/.next/static

pm2 reload config/pm2/ecosystem.config.js --only lkvip-academy --update-env
```

### 9.5 — Restart lại sau khi đã fix

```bash
pm2 restart lkvip-academy
pm2 save
```

---

## Bảng tóm tắt thông tin kỹ thuật

| Thành phần | Giá trị |
|---|---|
| Port nội bộ | `:3013` (bind `127.0.0.1` — không expose ra ngoài) |
| PM2 process name | `lkvip-academy` |
| PM2 config file | `config/pm2/ecosystem.config.js` |
| Start script | `apps/academy/start-academy.sh` |
| Next.js standalone server | `apps/academy/.next/standalone/server.js` |
| Nginx upstream | `lkvip_academy` → `127.0.0.1:3013` |
| Nginx config | `config/nginx/tc-gaming.conf` |
| SSL cert (dùng chung) | `/etc/letsencrypt/live/tc-gaming.live/` |
| Log output | `/var/LKVIP/data/logs/lkvip-academy-out.log` |
| Log error | `/var/LKVIP/data/logs/lkvip-academy-err.log` |
| API URL | `https://api.tc-gaming.live` |
| App URL | `https://academy.tc-gaming.live` |
