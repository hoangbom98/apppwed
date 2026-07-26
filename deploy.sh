#!/bin/bash
set -e
cd /var/LKVIP

echo "⬇️  Pulling latest code..."
git pull

echo "📦 Installing dependencies..."
pnpm install

echo "🏗️  Building packages..."
pnpm run build:packages

echo "🎨 Building frontends..."
pnpm run build:frontends

echo "🗄️  Running DB migrations..."
pnpm prisma:deploy || true

echo "♻️  Restarting backend..."
pm2 restart lkvip-api --update-env
pm2 save

echo "🌐 Reloading Nginx..."
nginx -t && systemctl reload nginx

echo "✅ Deploy completed at $(date)"
