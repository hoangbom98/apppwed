#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start-portal.sh — lkvipgroup-portal (Next.js standalone, PM2)
# All values fall back to sensible defaults but MUST be overridden in production.
# Set env vars in the parent shell or PM2 ecosystem.config.js — never hardcode.
# ─────────────────────────────────────────────────────────────────────────────
export PORT="${PORT:-3010}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"
export NODE_ENV="${NODE_ENV:-production}"
# Set FORTRESS_DATABASE_URL in the calling environment (PM2 env / systemd env).
# Format: mysql://user:password@127.0.0.1:3306/fortress_db?connection_limit=5
export FORTRESS_DATABASE_URL="${FORTRESS_DATABASE_URL:?FORTRESS_DATABASE_URL must be set}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://lkvip.tc-gaming.live}"

exec node /var/LKVIP/apps/lkvipgroup-portal/.next/standalone/server.js
