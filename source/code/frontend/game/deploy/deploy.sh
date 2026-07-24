#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Triển khai Game Frontend lên server Ubuntu
#
# CHUẨN BỊ:
#   chmod +x deploy/deploy.sh
#   Cấu hình SSH: ssh-keygen → copy public key lên server
#
# BIẾN MÔI TRƯỜNG cần thiết (đặt trong GitHub Secrets hoặc .env):
#   DEPLOY_HOST   — IP hoặc domain server (ví dụ: 123.123.123.123)
#   DEPLOY_USER   — user SSH (ví dụ: ubuntu hoặc root)
#   DEPLOY_KEY    — nội dung private SSH key
#   DEPLOY_PATH   — thư mục trên server (ví dụ: /var/www/game)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "🚀 Bắt đầu deploy Game Frontend..."

# ── Build ────────────────────────────────────────────────────────────────────
echo "📦 Building..."
npm ci --prefer-offline
npm run build

echo "✅ Build thành công. Thư mục dist:"
ls -lh dist/

# ── Upload lên server ─────────────────────────────────────────────────────────
DEPLOY_HOST="${DEPLOY_HOST:?Thiếu DEPLOY_HOST}"
DEPLOY_USER="${DEPLOY_USER:?Thiếu DEPLOY_USER}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/game}"

echo "📤 Đang upload lên $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH ..."
rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  dist/ \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/dist/"

# ── Reload NGINX ─────────────────────────────────────────────────────────────
echo "🔄 Reload NGINX..."
ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" \
  "sudo nginx -t && sudo systemctl reload nginx"

echo "🎉 Deploy hoàn tất!"
