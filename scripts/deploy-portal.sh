#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# deploy-portal.sh — Auto-deploy apps/lkvipgroup-portal lên Vercel
#
# Usage:
#   bash scripts/deploy-portal.sh [--prod]
#
# Required env vars (set trước khi chạy, hoặc script sẽ hỏi):
#   VERCEL_TOKEN              — Vercel personal access token
#   FORTRESS_DATABASE_URL     — Supabase pooling URL  (postgres://...?pgbouncer=true)
#   FORTRESS_DIRECT_URL       — Supabase direct URL   (postgres://...:5432/db)
#   ADMIN_USERNAME            — Admin login username
#   ADMIN_PASSWORD            — Admin login password
#   ADMIN_EMAIL               — Admin email
#   NEXT_PUBLIC_BASE_URL      — Production URL (e.g. https://lkvip.group)
#   CLOUDINARY_CLOUD_NAME     — Cloudinary cloud name
#   CLOUDINARY_API_KEY        — Cloudinary API key
#   CLOUDINARY_API_SECRET     — Cloudinary API secret
#
# Optional env vars (email / analytics):
#   SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS SMTP_FROM
#   NEXT_PUBLIC_GA_ID  NEXT_PUBLIC_META_PIXEL_ID
#
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

PORTAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/apps/lkvipgroup-portal"
PROD_FLAG=""
[[ "${1:-}" == "--prod" ]] && PROD_FLAG="--prod"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[portal]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
die()     { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ── 1. Kiểm tra công cụ ────────────────────────────────────────────────────────
info "Kiểm tra dependencies..."
command -v node  >/dev/null 2>&1 || die "node chưa cài"
command -v npm   >/dev/null 2>&1 || die "npm chưa cài"
command -v curl  >/dev/null 2>&1 || die "curl chưa cài"
command -v jq    >/dev/null 2>&1 || die "jq chưa cài — chạy: apt install jq"

# Cài vercel CLI nếu thiếu
if ! command -v vercel >/dev/null 2>&1; then
  info "Cài vercel CLI..."
  npm install -g vercel --silent
fi
success "vercel CLI: $(vercel --version 2>/dev/null | head -1)"

# ── 2. Đọc / hỏi secrets ──────────────────────────────────────────────────────
prompt_secret() {
  local varname="$1"; local prompt="$2"
  if [[ -z "${!varname:-}" ]]; then
    read -rsp "  ${prompt}: " val; echo
    export "$varname"="$val"
  fi
}
prompt_var() {
  local varname="$1"; local prompt="$2"; local default="${3:-}"
  if [[ -z "${!varname:-}" ]]; then
    read -rp "  ${prompt}${default:+ [${default}]}: " val; echo
    export "$varname"="${val:-$default}"
  fi
}

echo ""
info "═══ Nhập thông tin cần thiết ═══"
echo "  (Bỏ qua nếu đã export sẵn trong shell)"
echo ""

prompt_secret VERCEL_TOKEN         "VERCEL_TOKEN (vercel.com/account/tokens)"
prompt_var    NEXT_PUBLIC_BASE_URL  "NEXT_PUBLIC_BASE_URL" "https://lkvip.group"
prompt_secret FORTRESS_DATABASE_URL "FORTRESS_DATABASE_URL (Supabase pooling)"
prompt_secret FORTRESS_DIRECT_URL   "FORTRESS_DIRECT_URL  (Supabase direct)"
prompt_var    ADMIN_USERNAME        "ADMIN_USERNAME" "admin"
prompt_secret ADMIN_PASSWORD        "ADMIN_PASSWORD"
prompt_var    ADMIN_EMAIL           "ADMIN_EMAIL" "admin@lkvip.group"
prompt_var    CLOUDINARY_CLOUD_NAME "CLOUDINARY_CLOUD_NAME (Enter để bỏ qua)" ""
[[ -n "$CLOUDINARY_CLOUD_NAME" ]] && {
  prompt_secret CLOUDINARY_API_KEY    "CLOUDINARY_API_KEY"
  prompt_secret CLOUDINARY_API_SECRET "CLOUDINARY_API_SECRET"
}
prompt_var SMTP_HOST "SMTP_HOST (Enter để bỏ qua)" ""
[[ -n "$SMTP_HOST" ]] && {
  prompt_var    SMTP_PORT   "SMTP_PORT" "587"
  prompt_var    SMTP_SECURE "SMTP_SECURE (true/false)" "false"
  prompt_var    SMTP_USER   "SMTP_USER" ""
  prompt_secret SMTP_PASS   "SMTP_PASS"
  prompt_var    SMTP_FROM   "SMTP_FROM" "noreply@lkvip.group"
}
echo ""

# ── 3. Install npm deps ────────────────────────────────────────────────────────
info "Cài npm dependencies..."
cd "$PORTAL_DIR"
npm install --legacy-peer-deps --silent
success "npm install xong"

# ── 4. Tạo / link Vercel project qua API ──────────────────────────────────────
info "Lấy thông tin tổ chức Vercel..."
USER_INFO=$(curl -sf "https://api.vercel.com/v2/user" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json") || die "VERCEL_TOKEN không hợp lệ hoặc API lỗi"

USERNAME=$(echo "$USER_INFO" | jq -r '.user.username // .user.name')
# Thử lấy teamId (nếu là team account)
TEAM_ID=$(curl -sf "https://api.vercel.com/v2/teams?limit=1" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | jq -r '.teams[0].id // empty' 2>/dev/null || true)

TEAM_PARAM=""
[[ -n "$TEAM_ID" ]] && TEAM_PARAM="?teamId=${TEAM_ID}"

success "Đăng nhập: ${USERNAME}${TEAM_ID:+ (team: $TEAM_ID)}"

PROJECT_NAME="lkvipgroup-portal"
info "Tạo/lấy project '${PROJECT_NAME}' trên Vercel..."

# Thử lấy project đã tồn tại
EXISTING=$(curl -sf "https://api.vercel.com/v9/projects/${PROJECT_NAME}${TEAM_PARAM}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" 2>/dev/null || echo "null")
PROJECT_ID=$(echo "$EXISTING" | jq -r '.id // empty' 2>/dev/null || true)

if [[ -z "$PROJECT_ID" ]]; then
  # Tạo project mới
  CREATE_RESP=$(curl -sf -X POST "https://api.vercel.com/v10/projects${TEAM_PARAM}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${PROJECT_NAME}\",
      \"framework\": \"nextjs\",
      \"buildCommand\": \"prisma generate --schema=prisma/schema.prisma && next build\",
      \"installCommand\": \"npm install\",
      \"outputDirectory\": \".next\",
      \"regions\": [\"sin1\"],
      \"publicSource\": false
    }") || die "Không tạo được project Vercel"
  PROJECT_ID=$(echo "$CREATE_RESP" | jq -r '.id')
  success "Đã tạo project: ${PROJECT_ID}"
else
  success "Project đã tồn tại: ${PROJECT_ID}"
fi

ORG_ID="${TEAM_ID:-$USERNAME}"

# Lưu .vercel/project.json để vercel CLI nhận ra
mkdir -p "${PORTAL_DIR}/.vercel"
cat > "${PORTAL_DIR}/.vercel/project.json" <<EOF
{
  "orgId": "${ORG_ID}",
  "projectId": "${PROJECT_ID}"
}
EOF
success "Đã ghi .vercel/project.json"

# ── 5. Set environment variables ──────────────────────────────────────────────
info "Đang set environment variables..."

set_env() {
  local key="$1"; local value="$2"
  [[ -z "$value" ]] && return 0

  # Xoá env cũ (production, preview, development)
  for env_type in production preview development; do
    curl -sf -X DELETE \
      "https://api.vercel.com/v9/projects/${PROJECT_ID}/env${TEAM_PARAM}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"key\": \"${key}\", \"target\": [\"${env_type}\"]}" \
      >/dev/null 2>&1 || true
  done

  # Xác định loại env (NEXT_PUBLIC_* → plain, còn lại → encrypted)
  local env_type="encrypted"
  [[ "$key" == NEXT_PUBLIC_* ]] && env_type="plain"

  # Tạo env mới
  RESP=$(curl -sf -X POST \
    "https://api.vercel.com/v10/projects/${PROJECT_ID}/env${TEAM_PARAM}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"${key}\",
      \"value\": $(echo "$value" | jq -Rs .),
      \"type\": \"${env_type}\",
      \"target\": [\"production\", \"preview\", \"development\"]
    }" 2>&1) || { warn "Lỗi set ${key}: ${RESP}"; return 0; }
  echo -e "  ${GREEN}✓${NC} ${key}"
}

set_env "FORTRESS_DATABASE_URL"     "${FORTRESS_DATABASE_URL}"
set_env "FORTRESS_DIRECT_URL"       "${FORTRESS_DIRECT_URL}"
set_env "ADMIN_EMAIL"               "${ADMIN_EMAIL}"
set_env "ADMIN_USERNAME"            "${ADMIN_USERNAME}"
set_env "ADMIN_PASSWORD"            "${ADMIN_PASSWORD}"
set_env "NEXT_PUBLIC_BASE_URL"      "${NEXT_PUBLIC_BASE_URL}"
set_env "CLOUDINARY_CLOUD_NAME"     "${CLOUDINARY_CLOUD_NAME:-}"
set_env "CLOUDINARY_API_KEY"        "${CLOUDINARY_API_KEY:-}"
set_env "CLOUDINARY_API_SECRET"     "${CLOUDINARY_API_SECRET:-}"
set_env "SMTP_HOST"                 "${SMTP_HOST:-}"
set_env "SMTP_PORT"                 "${SMTP_PORT:-}"
set_env "SMTP_SECURE"               "${SMTP_SECURE:-}"
set_env "SMTP_USER"                 "${SMTP_USER:-}"
set_env "SMTP_PASS"                 "${SMTP_PASS:-}"
set_env "SMTP_FROM"                 "${SMTP_FROM:-}"
set_env "NEXT_PUBLIC_GA_ID"         "${NEXT_PUBLIC_GA_ID:-}"
set_env "NEXT_PUBLIC_META_PIXEL_ID" "${NEXT_PUBLIC_META_PIXEL_ID:-}"

success "Tất cả env vars đã được set"

# ── 6. Lưu GitHub Secrets vào file gợi ý ──────────────────────────────────────
GH_SECRETS_FILE="${PORTAL_DIR}/.vercel/.github-secrets.txt"
cat > "$GH_SECRETS_FILE" <<EOF
# Thêm vào GitHub repo → Settings → Secrets → Actions
VERCEL_TOKEN=${VERCEL_TOKEN}
VERCEL_ORG_ID=${ORG_ID}
VERCEL_PROJECT_ID_PORTAL=${PROJECT_ID}
EOF
chmod 600 "$GH_SECRETS_FILE"
warn "File gợi ý GitHub Secrets: apps/lkvipgroup-portal/.vercel/.github-secrets.txt"
warn "(File này đã được .gitignore — KHÔNG commit)"

# Đảm bảo .vercel/ trong .gitignore của portal
GITIGNORE="${PORTAL_DIR}/.gitignore"
if ! grep -q "^\.vercel" "$GITIGNORE" 2>/dev/null; then
  echo ".vercel" >> "$GITIGNORE"
fi

# ── 7. Build kiểm tra local ───────────────────────────────────────────────────
info "Chạy build local kiểm tra lỗi..."
cd "$PORTAL_DIR"

# Generate prisma client với env vars
export FORTRESS_DATABASE_URL FORTRESS_DIRECT_URL
npm run db:generate 2>&1 | tail -5 || warn "prisma generate lỗi — kiểm tra FORTRESS_DATABASE_URL"

# TypeScript check
info "TypeScript check..."
npx tsc --noEmit 2>&1 | head -20 || warn "Có TypeScript errors — deploy vẫn tiếp tục"

# ── 8. Deploy lên Vercel ──────────────────────────────────────────────────────
echo ""
info "═══ Bắt đầu deploy lên Vercel ═══"
if [[ -n "$PROD_FLAG" ]]; then
  info "Môi trường: PRODUCTION"
else
  warn "Môi trường: PREVIEW (dùng --prod để deploy production)"
fi
echo ""

DEPLOY_OUTPUT=$(vercel deploy \
  --token "${VERCEL_TOKEN}" \
  --yes \
  ${PROD_FLAG} \
  2>&1)

DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9._-]+\.vercel\.app' | tail -1)

echo ""
if [[ -n "$DEPLOY_URL" ]]; then
  success "═══════════════════════════════════"
  success "Deploy thành công!"
  success "URL: ${DEPLOY_URL}"
  success "═══════════════════════════════════"
  echo ""
  info "Kiểm tra livecheck..."
  sleep 5
  if curl -fsSL --max-time 20 "${DEPLOY_URL}" -o /dev/null 2>/dev/null; then
    success "Site đang live: ${DEPLOY_URL}"
  else
    warn "Site chưa phản hồi — có thể vẫn đang build. Chờ 1-2 phút rồi mở URL."
  fi
else
  warn "Không parse được URL. Raw output:"
  echo "$DEPLOY_OUTPUT"
fi

# ── 9. Hướng dẫn tiếp theo ───────────────────────────────────────────────────
echo ""
info "═══ Bước tiếp theo ═══"
echo ""
echo "  1. Thêm custom domain (tùy chọn):"
echo "     vercel domains add lkvip.group --token \$VERCEL_TOKEN"
echo ""
echo "  2. Thêm GitHub Secrets để CI/CD tự động:"
echo "     Cat file: apps/lkvipgroup-portal/.vercel/.github-secrets.txt"
echo "     → Repo GitHub → Settings → Secrets → Actions"
echo ""
echo "  3. Deploy lại lên production khi cần:"
echo "     bash scripts/deploy-portal.sh --prod"
echo ""
echo "  4. Xem logs deploy:"
echo "     vercel logs ${DEPLOY_URL:-<deploy-url>} --token \$VERCEL_TOKEN"
echo ""
