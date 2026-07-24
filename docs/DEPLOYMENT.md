# Deployment Guide — KJC Platform v2.0

---

## 1. Yêu cầu VPS

| Spec | Tối thiểu | Khuyến nghị |
|------|-----------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |
| Bandwidth | 100 Mbps | 1 Gbps |

---

## 2. Cài đặt lần đầu (First-time Setup)

### 2.1 Chạy setup script

```bash
# SSH vào VPS
ssh user@your-vps-ip

# Clone repo
cd /var/www
git clone https://github.com/your-org/website-admin.git
cd website-admin

# Chạy setup script (cài Node.js, PM2, MySQL, Redis, Nginx)
chmod +x code/backend/scripts/setup.sh
sudo ./code/backend/scripts/setup.sh
```

Setup script cài đặt:
- Node.js 20 LTS (qua NodeSource)
- PM2 (global)
- MySQL 8.0
- Redis 7
- Nginx

### 2.2 Cấu hình environment

```bash
cp .env.example code/backend/.env
nano code/backend/.env
```

Điền đầy đủ các biến bắt buộc (xem [SETUP.md](SETUP.md#3-environment-variables)).

**Lưu ý bảo mật:**
```bash
# Chmod .env — chỉ owner được đọc
chmod 600 code/backend/.env
```

### 2.3 Tạo databases và chạy migrations

```bash
cd code/backend

# Install dependencies
npm ci --omit=dev

# Generate Prisma clients
npm run prisma:generate

# Deploy migrations (production — không tạo migration mới)
npm run prisma:deploy:all

# Seed dữ liệu ban đầu
npm run seed:all
```

### 2.4 Tạo indexes

```bash
mysql -u root -p < config/database/indexes.sql
```

### 2.5 Cấu hình SSL

```bash
chmod +x code/backend/scripts/ssl-setup.sh
sudo ./code/backend/scripts/ssl-setup.sh your-domain.com
```

### 2.6 Khởi động PM2

```bash
cd /var/www/website-admin
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # Auto-start sau reboot
```

---

## 3. Deploy thông thường (Sau lần đầu)

### 3.1 Thủ công

```bash
cd /var/www/website-admin

# Pull code
git fetch origin main
git reset --hard origin/main

# Update dependencies
cd code/backend
npm ci --omit=dev

# Regenerate Prisma clients
npm run prisma:generate

# Deploy schema changes (nếu có)
npm run prisma:deploy:all

# Reload PM2 (zero-downtime)
cd /var/www/website-admin
pm2 reload ecosystem.config.js --update-env
```

### 3.2 Dùng deploy script

```bash
chmod +x code/backend/scripts/deploy.sh
./code/backend/scripts/deploy.sh
```

### 3.3 Tự động qua GitHub Actions

Push vào branch `main` → CI pass → tự động deploy.

**Điều kiện:** Đã cấu hình GitHub Secrets (xem §5).

---

## 4. PM2 Configuration

File: `ecosystem.config.js` (root)

```javascript
module.exports = {
  apps: [{
    name: 'kjc-api',
    script: './code/backend/server.js',
    instances: 'max',          // Tất cả CPU cores
    exec_mode: 'cluster',      // Cluster mode cho zero-downtime reload
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    log_file: './logs/combined.log',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
  }]
};
```

### PM2 commands

```bash
pm2 status                          # Xem trạng thái
pm2 reload kjc-api --update-env     # Zero-downtime reload
pm2 restart kjc-api                 # Hard restart (có downtime)
pm2 logs kjc-api                    # Xem logs realtime
pm2 monit                           # CPU/RAM monitor
pm2 save                            # Lưu process list
```

---

## 5. GitHub Actions Secrets

Cấu hình trong GitHub repo → Settings → Secrets → Actions:

| Secret | Mô tả | Ví dụ |
|--------|-------|-------|
| `VPS_HOST` | IP hoặc hostname VPS | `203.0.113.10` |
| `VPS_USER` | SSH username | `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key (ED25519 hoặc RSA) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (optional, default 22) | `22` |

### Tạo SSH key pair cho CI/CD

```bash
# Tạo key pair trên máy local
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/kjc_deploy

# Copy public key lên VPS
ssh-copy-id -i ~/.ssh/kjc_deploy.pub user@your-vps-ip

# Copy private key vào GitHub Secret VPS_SSH_KEY
cat ~/.ssh/kjc_deploy
```

---

## 6. Nginx Configuration

File mẫu: `config/nginx/`

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL (Certbot auto-manage)
    ssl_certificate     /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting (Nginx level — trước Express)
        limit_req zone=api_limit burst=20 nodelay;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 7. Backup & Restore

### Backup thủ công

```bash
cd code/backend
npm run backup
# → Tạo file backup trong ./backups/backup-YYYY-MM-DD.sql.gz
```

### Restore từ backup

```bash
cd code/backend
npm run restore -- --file=./backups/backup-2024-01-15.sql.gz
```

### Cron backup tự động

```bash
# Cấu hình via setup script
chmod +x code/backend/scripts/cron-setup.sh
./code/backend/scripts/cron-setup.sh
```

Lịch mặc định: backup hàng ngày lúc 2 AM, giữ 30 ngày gần nhất.

---

## 8. Health Monitoring

```bash
# API health
curl https://api.your-domain.com/health/live

# PM2 status
pm2 status

# MySQL status
systemctl status mysql

# Redis status
redis-cli ping

# Disk usage
df -h

# Memory
free -h
```

---

## 9. Rollback

Nếu deploy bị lỗi:

```bash
cd /var/www/website-admin

# Rollback về commit trước
git log --oneline -5    # Tìm commit hash cần rollback
git reset --hard <commit-hash>

# Reinstall và restart
cd code/backend
npm ci --omit=dev
npm run prisma:generate
pm2 reload ecosystem.config.js --update-env
```
