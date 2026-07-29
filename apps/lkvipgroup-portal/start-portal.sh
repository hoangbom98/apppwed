#!/bin/bash
export PORT=3010
export HOSTNAME=127.0.0.1
export NODE_ENV=production
export FORTRESS_DATABASE_URL="mysql://lkvip_app:LKvip@App2026!@127.0.0.1:3306/fortress_db?connection_limit=5"
export NEXT_PUBLIC_APP_URL="https://lkvip.tc-gaming.live"

exec node /var/LKVIP/apps/lkvipgroup-portal/.next/standalone/server.js
