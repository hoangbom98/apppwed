# 🚀 Hướng dẫn Deploy Game Frontend lên Ubuntu + NGINX

## Yêu cầu
- Ubuntu 20.04/22.04
- Node.js 20 (cài bằng nvm)
- NGINX
- Domain trỏ về IP server (hoặc dùng `localhost` để test)

---

## 1. Cài đặt môi trường server

```bash
# Cập nhật Ubuntu
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20 qua nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # → v20.x.x

# Cài NGINX
sudo apt install -y nginx

# Tạo thư mục web
sudo mkdir -p /var/www/game/dist
sudo chown -R $USER:$USER /var/www/game
```

---

## 2. Build và upload (thủ công lần đầu)

```bash
# Trên máy local (Windows → Git Bash hoặc WSL)
cd "D:\Dự án chuẩn\website-admin\frontend\game"

# Tạo file .env.production
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
EOF

# Build
npm run build

# Upload lên server (thay các giá trị phù hợp)
rsync -avz --delete dist/ ubuntu@YOUR_SERVER_IP:/var/www/game/dist/
```

---

## 3. Cấu hình NGINX

```bash
# Copy file cấu hình
sudo cp deploy/nginx.conf /etc/nginx/sites-available/game.conf

# Chỉnh sửa domain
sudo nano /etc/nginx/sites-available/game.conf
# → Thay YOUR_DOMAIN bằng domain thật

# Kích hoạt site
sudo ln -sf /etc/nginx/sites-available/game.conf /etc/nginx/sites-enabled/

# Xoá default nếu chưa xoá
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## 4. Cài SSL với Let's Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Sau khi cài SSL, bỏ comment phần `listen 443 ssl` và redirect HTTP→HTTPS trong `nginx.conf`.

---

## 5. Thiết lập CI/CD (GitHub Actions)

### Thêm GitHub Secrets

Vào **Settings → Secrets and variables → Actions** của repo, thêm:

| Secret | Giá trị |
|--------|---------|
| `DEPLOY_HOST` | IP server (vd: `123.456.789.0`) |
| `DEPLOY_USER` | SSH user (vd: `ubuntu`) |
| `DEPLOY_SSH_KEY` | Nội dung file `~/.ssh/id_rsa` (private key) |
| `DEPLOY_PATH` | `/var/www/game` |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com/api` |
| `VITE_WS_URL` | `wss://api.yourdomain.com` |

### Cách lấy SSH key

```bash
# Trên server
ssh-keygen -t ed25519 -C "github-deploy"
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/id_ed25519   # ← Copy nội dung này vào DEPLOY_SSH_KEY
```

### Kiểm tra NGINX sudoers (không cần password)

```bash
sudo visudo
# Thêm dòng:
ubuntu ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx
```

---

## 6. Kiểm tra deploy hoạt động

```bash
# Push code lên main
git add .
git commit -m "feat: add Dashboard + CI/CD"
git push origin main

# Xem trạng thái trên GitHub Actions tab
# URL: https://github.com/YOUR_ORG/YOUR_REPO/actions
```

---

## 7. Cấu trúc file đã tạo

```
frontend/game/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← CI/CD pipeline
├── deploy/
│   ├── nginx.conf              ← NGINX config
│   └── deploy.sh               ← Script deploy thủ công
└── src/
    ├── api/
    │   └── dashboard.ts        ← Mock API + types
    ├── components/
    │   └── dashboard/
    │       ├── SummaryCards.tsx
    │       ├── TransactionChart.tsx
    │       └── RecentTransactions.tsx
    └── pages/
        └── Dashboard.tsx       ← Protected dashboard page
```

---

## 8. Khi backend API sẵn sàng

Trong `src/api/dashboard.ts`, đổi:

```typescript
const USE_MOCK = false;   // ← từ true sang false
```

Dữ liệu sẽ tự động lấy từ các endpoint:
- `GET /api/game/dashboard/summary`
- `GET /api/game/dashboard/chart?days=14`
- `GET /api/game/dashboard/transactions?limit=8`
