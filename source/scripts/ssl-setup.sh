#!/usr/bin/env bash
# =============================================================================
#  ssl-setup.sh — LKVIP GROUP SSL Certificate Setup
#
#  Obtains Let's Encrypt certificates for all 7 LKVIP subdomains using certbot
#  with the Nginx plugin, and configures auto-renewal.
#
#  Usage:
#    sudo bash source/scripts/ssl-setup.sh --domain yourdomain.com --email admin@yourdomain.com
#
#  Options:
#    --domain  <yourdomain.com>     Root domain (required)
#    --email   <admin@example.com>  Email for Let's Encrypt notifications (required)
#    --staging                      Use Let's Encrypt staging server (for testing)
#
#  Subdomains covered:
#    hub.yourdomain.com
#    game.yourdomain.com
#    trade.yourdomain.com
#    dating.yourdomain.com
#    sports.yourdomain.com
#    admin.yourdomain.com
#    api.yourdomain.com
# =============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

require_root

# ── Parse arguments ───────────────────────────────────────────────────────────
DOMAIN=""
EMAIL=""
STAGING=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="$2";  shift 2 ;;
    --email)   EMAIL="$2";   shift 2 ;;
    --staging) STAGING=true; shift ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  log_error "Usage: sudo bash $0 --domain yourdomain.com --email admin@yourdomain.com"
  exit 1
fi

require_cmd certbot
require_cmd nginx

# ── Subdomains ────────────────────────────────────────────────────────────────
SUBDOMAINS=("hub" "game" "trade" "dating" "sports" "admin" "api")

log_header "LKVIP GROUP — SSL Certificate Setup"
log_info "Domain:  $DOMAIN"
log_info "Email:   $EMAIL"
log_info "Staging: $STAGING"
log_info "Subdomains: ${SUBDOMAINS[*]}"

# Build -d flags for certbot
DOMAINS_FLAGS=""
for SUB in "${SUBDOMAINS[@]}"; do
  DOMAINS_FLAGS="$DOMAINS_FLAGS -d ${SUB}.${DOMAIN}"
done

# ── Obtain certificate ────────────────────────────────────────────────────────
log_step "Obtaining Let's Encrypt certificate"

CERTBOT_CMD="certbot --nginx"
CERTBOT_CMD="$CERTBOT_CMD $DOMAINS_FLAGS"
CERTBOT_CMD="$CERTBOT_CMD --email $EMAIL"
CERTBOT_CMD="$CERTBOT_CMD --agree-tos"
CERTBOT_CMD="$CERTBOT_CMD --no-eff-email"
CERTBOT_CMD="$CERTBOT_CMD --redirect"
CERTBOT_CMD="$CERTBOT_CMD --non-interactive"

if [[ "$STAGING" == true ]]; then
  CERTBOT_CMD="$CERTBOT_CMD --staging"
  log_warn "Using Let's Encrypt STAGING server — certificates will not be trusted by browsers"
fi

eval "$CERTBOT_CMD"
log_ok "Certificate obtained for all subdomains"

# ── Verify auto-renewal ───────────────────────────────────────────────────────
log_step "Verifying auto-renewal configuration"
certbot renew --dry-run --quiet
log_ok "Auto-renewal dry-run passed"

# ── Check systemd timer or cron ───────────────────────────────────────────────
if systemctl list-timers | grep -q certbot; then
  log_ok "certbot systemd timer is active (auto-renewal enabled)"
elif crontab -l 2>/dev/null | grep -q certbot; then
  log_ok "certbot cron job found (auto-renewal enabled)"
else
  log_warn "No automatic renewal detected — adding cron job"
  (crontab -l 2>/dev/null || true; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
  log_ok "Cron job added: certbot renew at 03:00 daily"
fi

# ── Reload Nginx ──────────────────────────────────────────────────────────────
log_step "Reloading Nginx"
nginx -t
systemctl reload nginx
log_ok "Nginx reloaded with SSL configuration"

# ── Summary ───────────────────────────────────────────────────────────────────
log_header "SSL Setup Complete"
for SUB in "${SUBDOMAINS[@]}"; do
  echo -e "  ${GREEN}✓${RESET}  https://${SUB}.${DOMAIN}"
done
echo ""
log_info "Certificate location: /etc/letsencrypt/live/${SUBDOMAINS[0]}.${DOMAIN}/"
log_info "Check expiry:  certbot certificates"
log_info "Manual renew:  certbot renew"
