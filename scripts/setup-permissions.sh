#!/usr/bin/env bash
# =============================================================================
# setup-permissions.sh — Phân quyền thư mục cho LKVIP GROUP trên VPS
#
# Thiết lập ownership và chmod đúng cho toàn bộ /var/LKVIP dựa trên
# kiến trúc thực tế của dự án:
#
#   User chạy app  : lkvip   (được tạo bởi vps-setup.sh)
#   Web server     : www-data (Nginx)
#   Project root   : /var/LKVIP
#
# Nguyên tắc:
#   • Mã nguồn        : lkvip:www-data 755/644 — lkvip đọc/ghi, nginx đọc
#   • .env files      : root:lkvip     640     — chỉ root ghi, lkvip đọc
#   • data/uploads    : lkvip:www-data 775     — cả app lẫn nginx cần ghi
#   • data/logs       : lkvip:lkvip    755     — chỉ app (PM2) ghi log
#   • logs/           : lkvip:lkvip    755     — PM2 logs
#   • .backups/       : lkvip:lkvip    750     — private, không cần nginx
#   • node_modules    : lkvip:lkvip    755     — chỉ cần đọc để chạy
#   • dist/ folders   : lkvip:www-data 755     — nginx serve static files
#   • *.sh scripts    : root:root      755     — execute bởi root/lkvip
#   • config/.db-pass : root:root      600     — tuyệt mật
#
# Usage:
#   sudo bash /var/LKVIP/scripts/setup-permissions.sh
#
# PHẢI chạy với quyền root.
# Chạy lại bất cứ lúc nào sau git pull hoặc khi có lỗi permission denied.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[perms]${NC} $*"; }
warn()  { echo -e "${YELLOW}[perms]${NC} $*"; }
error() { echo -e "${RED}[perms]${NC} $*" >&2; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

# ── Phải chạy với root ────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  error "Cần quyền root: sudo bash scripts/setup-permissions.sh"
  exit 1
fi

PROJECT_DIR="/var/LKVIP"
APP_USER="lkvip"
WEB_USER="www-data"

# ── Kiểm tra user tồn tại ─────────────────────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  error "User '$APP_USER' chưa tồn tại. Chạy vps-setup.sh trước."
  exit 1
fi

if ! id "$WEB_USER" &>/dev/null; then
  warn "User '$WEB_USER' không tồn tại — Nginx có thể chưa được cài."
  warn "Tiếp tục nhưng một số quyền sẽ dùng $APP_USER thay thế."
  WEB_USER="$APP_USER"
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  error "Thư mục dự án '$PROJECT_DIR' không tồn tại."
  exit 1
fi

echo ""
info "Bắt đầu phân quyền cho LKVIP GROUP..."
info "  Project  : $PROJECT_DIR"
info "  App user : $APP_USER"
info "  Web user : $WEB_USER"

# =============================================================================
step "1 — Ownership toàn bộ dự án (base)"
# =============================================================================

# Toàn bộ project thuộc về lkvip:www-data
# → lkvip (PM2/Node) có quyền đọc/ghi mã nguồn
# → www-data (Nginx) có quyền đọc static files và config
chown -R "$APP_USER:$WEB_USER" "$PROJECT_DIR"
info "chown -R $APP_USER:$WEB_USER $PROJECT_DIR"

# =============================================================================
step "2 — Chmod thư mục và file mã nguồn"
# =============================================================================

# Tất cả thư mục: 755 (owner rwx, group r-x, others r-x)
find "$PROJECT_DIR" -type d -exec chmod 755 {} \;
info "Thư mục: 755"

# Tất cả file: 644 (owner rw-, group r--, others r--)
find "$PROJECT_DIR" -type f -exec chmod 644 {} \;
info "File nguồn: 644"

# =============================================================================
step "3 — Shell scripts: +x"
# =============================================================================

# Tất cả *.sh phải executable
find "$PROJECT_DIR" -name "*.sh" -type f -exec chmod 755 {} \;
info "*.sh scripts: 755"

# =============================================================================
step "4 — Bảo mật .env files (640 = chỉ root ghi, lkvip đọc)"
# =============================================================================

# .env chính của backend
ENV_BACKEND="$PROJECT_DIR/apps/backend/.env"
if [[ -f "$ENV_BACKEND" ]]; then
  chown root:"$APP_USER" "$ENV_BACKEND"
  chmod 640 "$ENV_BACKEND"
  info ".env backend: root:$APP_USER 640"
fi

# .env.local / .env.production / .env.* bất kỳ trong backend
find "$PROJECT_DIR/apps/backend" -maxdepth 1 -name ".env*" -type f | while read -r f; do
  chown root:"$APP_USER" "$f"
  chmod 640 "$f"
  info "  $(basename "$f"): root:$APP_USER 640"
done

# config/.db-pass — tuyệt mật, chỉ root
DB_PASS_FILE="$PROJECT_DIR/config/.db-pass"
if [[ -f "$DB_PASS_FILE" ]]; then
  chown root:root "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
  info "config/.db-pass: root:root 600"
fi

# =============================================================================
step "5 — Thư mục data/uploads (cần ghi bởi cả app và nginx)"
# =============================================================================

UPLOADS_DIR="$PROJECT_DIR/data/uploads"
mkdir -p "$UPLOADS_DIR"
chown -R "$APP_USER:$WEB_USER" "$UPLOADS_DIR"
chmod 775 "$UPLOADS_DIR"
# Các file đã upload: lkvip và www-data đều cần đọc
find "$UPLOADS_DIR" -type f -exec chmod 664 {} \; 2>/dev/null || true
info "data/uploads: $APP_USER:$WEB_USER 775"

# Upload folder trong backend source (nếu có)
BACKEND_UPLOADS="$PROJECT_DIR/apps/backend/src/uploads"
if [[ -d "$BACKEND_UPLOADS" ]]; then
  chown -R "$APP_USER:$WEB_USER" "$BACKEND_UPLOADS"
  chmod 775 "$BACKEND_UPLOADS"
  info "apps/backend/src/uploads: $APP_USER:$WEB_USER 775"
fi

# =============================================================================
step "6 — Thư mục logs (chỉ PM2/app ghi)"
# =============================================================================

# PM2 logs (ecosystem.config.js now points to data/logs/)
DATA_LOG_DIR="$PROJECT_DIR/data/logs"
mkdir -p "$DATA_LOG_DIR"
chown -R "$APP_USER:$APP_USER" "$DATA_LOG_DIR"
chmod 755 "$DATA_LOG_DIR"
find "$DATA_LOG_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
info "data/logs/: $APP_USER:$APP_USER 755"

# Legacy logs/ dir — keep if it exists, don't create fresh
LOG_DIR="$PROJECT_DIR/logs"
if [[ -d "$LOG_DIR" ]]; then
  chown -R "$APP_USER:$APP_USER" "$LOG_DIR"
  chmod 755 "$LOG_DIR"
  find "$LOG_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
  info "logs/: $APP_USER:$APP_USER 755"
fi

# data/.health-cooldown — health-check.sh writes alert timestamps here
COOLDOWN_DIR="$PROJECT_DIR/data/.health-cooldown"
mkdir -p "$COOLDOWN_DIR"
chown -R "$APP_USER:$APP_USER" "$COOLDOWN_DIR"
chmod 700 "$COOLDOWN_DIR"
info "data/.health-cooldown/: $APP_USER:$APP_USER 700"

# Backend app logs (nếu có)
BACKEND_LOGS="$PROJECT_DIR/apps/backend/logs"
if [[ -d "$BACKEND_LOGS" ]]; then
  chown -R "$APP_USER:$APP_USER" "$BACKEND_LOGS"
  chmod 755 "$BACKEND_LOGS"
  info "apps/backend/logs/: $APP_USER:$APP_USER 755"
fi

# =============================================================================
step "7 — Thư mục .backups (private)"
# =============================================================================

BACKUP_DIR="$PROJECT_DIR/.backups"
mkdir -p "$BACKUP_DIR"
chown -R "$APP_USER:$APP_USER" "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"
info ".backups/: $APP_USER:$APP_USER 750"

# =============================================================================
step "8 — dist/ folders (static files, Nginx cần đọc)"
# =============================================================================

for dist_dir in "$PROJECT_DIR"/apps/*/dist; do
  if [[ -d "$dist_dir" ]]; then
    chown -R "$APP_USER:$WEB_USER" "$dist_dir"
    find "$dist_dir" -type d -exec chmod 755 {} \;
    find "$dist_dir" -type f -exec chmod 644 {} \;
    info "$(echo "$dist_dir" | sed "s|$PROJECT_DIR/||"): $APP_USER:$WEB_USER 755/644"
  fi
done

# =============================================================================
step "9 — node_modules (chỉ cần đọc)"
# =============================================================================

NM_ROOT="$PROJECT_DIR/node_modules"
if [[ -d "$NM_ROOT" ]]; then
  chown -R "$APP_USER:$APP_USER" "$NM_ROOT"
  # Không chmod toàn bộ node_modules — quá chậm và không cần thiết
  # pnpm đã quản lý symlinks, chỉ cần đảm bảo owner đúng
  info "node_modules/: $APP_USER:$APP_USER (owner fixed, chmod skipped)"
fi

# node_modules trong apps/backend
for nm in "$PROJECT_DIR"/apps/*/node_modules "$PROJECT_DIR"/packages/*/node_modules; do
  if [[ -d "$nm" ]]; then
    chown -R "$APP_USER:$APP_USER" "$nm" 2>/dev/null || true
  fi
done

# =============================================================================
step "10 — config/ directory"
# =============================================================================

CONFIG_DIR="$PROJECT_DIR/config"
if [[ -d "$CONFIG_DIR" ]]; then
  chown -R "$APP_USER:$WEB_USER" "$CONFIG_DIR"
  find "$CONFIG_DIR" -type d -exec chmod 755 {} \;
  find "$CONFIG_DIR" -type f -exec chmod 644 {} \;
  # .db-pass đã được xử lý ở bước 4 — re-apply để chắc chắn
  if [[ -f "$DB_PASS_FILE" ]]; then
    chown root:root "$DB_PASS_FILE"
    chmod 600 "$DB_PASS_FILE"
  fi
  info "config/: $APP_USER:$WEB_USER 755/644"
fi

# =============================================================================
step "11 — .git directory (private)"
# =============================================================================

GIT_DIR="$PROJECT_DIR/.git"
if [[ -d "$GIT_DIR" ]]; then
  chown -R "$APP_USER:$APP_USER" "$GIT_DIR"
  chmod 700 "$GIT_DIR"
  info ".git/: $APP_USER:$APP_USER 700"
fi

# =============================================================================
step "12 — Thư mục tmp (nếu có)"
# =============================================================================

TMP_DIR="$PROJECT_DIR/tmp"
if [[ -d "$TMP_DIR" ]]; then
  chown -R "$APP_USER:$APP_USER" "$TMP_DIR"
  chmod 1777 "$TMP_DIR"    # sticky bit + world-writable
  info "tmp/: $APP_USER:$APP_USER 1777 (sticky)"
fi

# =============================================================================
step "Kiểm tra kết quả"
# =============================================================================

echo ""
info "Tóm tắt phân quyền:"
echo ""
printf "  %-40s %s\n" "Đường dẫn" "Owner / Mode"
printf "  %-40s %s\n" "----------" "------------"

_show() {
  local path="$1"
  if [[ -e "$path" ]]; then
    local info_str
    info_str="$(stat -c '%U:%G %a' "$path" 2>/dev/null || echo 'N/A')"
    printf "  %-40s %s\n" "$(echo "$path" | sed "s|$PROJECT_DIR/||")" "$info_str"
  fi
}

_show "$PROJECT_DIR"
_show "$PROJECT_DIR/apps/backend/.env"
_show "$PROJECT_DIR/config/.db-pass"
_show "$PROJECT_DIR/data/uploads"
_show "$PROJECT_DIR/data/logs"
_show "$PROJECT_DIR/data/.health-cooldown"
_show "$PROJECT_DIR/.backups"
_show "$PROJECT_DIR/apps/backend/dist"
_show "$PROJECT_DIR/apps/hub/dist"
_show "$PROJECT_DIR/apps/game/dist"
_show "$PROJECT_DIR/apps/dating/dist"

echo ""
info "✅ Phân quyền hoàn tất!"
echo ""
warn "Lưu ý:"
echo "  • Chạy lại script này sau mỗi git pull nếu có file mới."
echo "  • Nếu gặp lỗi 'permission denied', kiểm tra: ls -la /var/LKVIP/<thư mục lỗi>"
echo "  • Nginx user: $(ps aux | grep nginx | grep -v grep | awk '{print $1}' | head -1 || echo 'www-data (không thể detect)')"
echo "  • PM2 user  : $(pm2 list 2>/dev/null | grep lkvip-api | awk '{print $2}' | head -1 || echo 'kiểm tra: pm2 list')"
