#!/bin/bash
# =============================================================================
#  ssl-setup.sh — Issue / renew Let's Encrypt SSL certificates
#  Domain  : tc-gaming.live
#  Subdomains covered:
#    api   hub   trade   dating   sports   game   admin   lkvip
#    banking   invest   store
#
#  Run as : root
#  Usage  : bash /var/LKVIP/scripts/ssl-setup.sh
#
#  Prerequisites:
#    - DNS A records pointing all subdomains to this VPS IP
#    - Nginx running on port 80 (certbot webroot challenge)
# =============================================================================
set -euo pipefail

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  LKVIP GROUP — SSL Certificate Setup"
echo "  Domain: tc-gaming.live"
echo "═══════════════════════════════════════════════════════"

# ── Install certbot if not present ───────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "▶ Installing certbot..."
  apt install -y certbot python3-certbot-nginx
fi

# ── Nginx must be running for HTTP-01 challenge ───────────────────────────────
if ! systemctl is-active --quiet nginx; then
  echo "▶ Starting Nginx..."
  systemctl start nginx
fi

# ── Issue certificate (all subdomains in one cert = one SAN) ─────────────────
echo ""
echo "▶ Issuing/renewing certificate..."
certbot --nginx \
  -d tc-gaming.live \
  -d www.tc-gaming.live \
  -d api.tc-gaming.live \
  -d hub.tc-gaming.live \
  -d trade.tc-gaming.live \
  -d dating.tc-gaming.live \
  -d sports.tc-gaming.live \
  -d game.tc-gaming.live \
  -d admin.tc-gaming.live \
  -d lkvip.tc-gaming.live \
  -d banking.tc-gaming.live \
  -d invest.tc-gaming.live \
  -d store.tc-gaming.live \
  --agree-tos \
  --non-interactive \
  --redirect

echo ""
echo "▶ Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "▶ Checking auto-renewal timer..."
systemctl status certbot.timer --no-pager | head -5 || true

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  SSL setup complete!"
echo "  Certificate: /etc/letsencrypt/live/tc-gaming.live/"
echo "  Auto-renew : certbot renew (systemd timer)"
echo "═══════════════════════════════════════════════════════"
