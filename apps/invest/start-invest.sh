#!/bin/bash
export PORT="${PORT:-3011}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.tc-gaming.live}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://invest.tc-gaming.live}"

exec node /var/LKVIP/apps/invest/.next/standalone/server.js
