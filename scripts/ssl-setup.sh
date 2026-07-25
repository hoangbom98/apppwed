#!/usr/bin/env bash
# =============================================================================
# ssl-setup.sh — Let's Encrypt SSL for tc-gaming.live
#
# Issues one wildcard-capable cert covering all 7 DNS records:
#   tc-gaming.live, www.tc-gaming.live, hub.tc-gaming.live,
#   api.tc-gaming.live, trade.tc-gaming.live, sports.tc-gaming.live,
#   admin.tc-gaming.live
#
# Requirements:
#   - Nginx must be running with /etc/nginx/sites-enabled/tc-gaming symlinked
#   - All 7 A records must point to 104.248.146.203 before running this
#   - certbot + python3-certbot-nginx installed (done by vps-setup.sh)
#
# Usage:
#   sudo bash scripts/ssl-setup.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[ssl]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ssl]${NC} $*"; }
error() { echo -e "${RED}[ssl]${NC} $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  error "Run as root: sudo bash scripts/ssl-setup.sh"
  exit 1
fi

DOMAIN="tc-gaming.live"
EMAIL="${CERTBOT_EMAIL:-admin@tc-gaming.live}"

# ── Verify certbot is available ───────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  info "Installing certbot..."
  apt-get install -y certbot python3-certbot-nginx
fi

# ── Verify Nginx is running ───────────────────────────────────────────────────
if ! systemctl is-active --quiet nginx; then
  error "Nginx is not running. Start it first: systemctl start nginx"
  exit 1
fi

# ── Ensure DNS tools available ────────────────────────────────────────────────
if ! command -v dig &>/dev/null; then
  apt-get install -y dnsutils 2>/dev/null || true
fi

# ── Check DNS resolves to this server ─────────────────────────────────────────
SERVER_IP="$(curl -4 -sf https://ifconfig.me 2>/dev/null || curl -4 -sf https://api.ipify.org 2>/dev/null || echo 'unknown')"
info "Server public IP: $SERVER_IP"

FAILED_DOMAINS=()
for sub in "" "www." "hub." "api." "trade." "sports." "admin."; do
  fqdn="${sub}${DOMAIN}"
  if command -v dig &>/dev/null; then
    resolved="$(dig +short A "$fqdn" @8.8.8.8 2>/dev/null | head -1 || echo '')"
  else
    resolved="$(getent hosts "$fqdn" 2>/dev/null | awk '{print $1}' | head -1 || echo '')"
  fi
  if [[ "$resolved" != "$SERVER_IP" ]]; then
    warn "DNS mismatch: $fqdn → '$resolved' (expected $SERVER_IP)"
    FAILED_DOMAINS+=("$fqdn")
  else
    info "DNS OK: $fqdn → $resolved"
  fi
done

if [[ ${#FAILED_DOMAINS[@]} -gt 0 ]]; then
  warn "The following domains do not resolve to this server:"
  for d in "${FAILED_DOMAINS[@]}"; do warn "  ✗ $d"; done
  warn "Certbot will likely fail for these. Continuing anyway (Cloudflare proxy may interfere)."
  warn "TIP: Temporarily disable Cloudflare proxy (grey cloud) for DNS challenge, then re-enable."
fi

# ── Issue certificate ─────────────────────────────────────────────────────────
info "Requesting certificates for all tc-gaming.live subdomains..."

certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  -d "hub.$DOMAIN" \
  -d "api.$DOMAIN" \
  -d "trade.$DOMAIN" \
  -d "sports.$DOMAIN" \
  -d "admin.$DOMAIN"

info "SSL certificates issued successfully"

# ── Verify auto-renewal ───────────────────────────────────────────────────────
info "Testing auto-renewal..."
certbot renew --dry-run
info "Auto-renewal OK"

# ── Reload Nginx ──────────────────────────────────────────────────────────────
nginx -t && systemctl reload nginx
info "Nginx reloaded with SSL config"

echo ""
info "SSL setup complete for tc-gaming.live"
info "Certificate path: /etc/letsencrypt/live/$DOMAIN/"
info "Auto-renewal:     systemctl status certbot.timer"
