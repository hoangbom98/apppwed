#!/bin/bash
export PORT="${PORT:-3013}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.tc-gaming.live}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://academy.tc-gaming.live}"

exec node /var/LKVIP/apps/academy/.next/standalone/server.js
