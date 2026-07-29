#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/ts-fix.sh — LKVIP Monorepo TypeScript Auto-Fix
#
# Tự động sửa:
#   1. pnpm.overrides trong root package.json → pin typescript + @types/react
#   2. tsconfig.json của Next.js apps → đúng config
#   3. tsconfig.json của Vite apps → đúng config
#   4. Thêm css.d.ts cho Next.js apps
#   5. pnpm install để apply overrides
#
# Usage: bash scripts/ts-fix.sh [--dry-run] [--app <name>]
#   --dry-run    : in ra thay đổi sẽ làm nhưng không apply
#   --app <name> : chỉ fix một app cụ thể
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Flags ─────────────────────────────────────────────────────────────────────
DRY_RUN=false
FILTER_APP=""
for ((i=1; i<=$#; i++)); do
  [[ "${!i}" == "--dry-run" ]]  && DRY_RUN=true
  [[ "${!i}" == "--app" ]]      && { j=$((i+1)); FILTER_APP="${!j:-}"; }
done

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[fix]${NC} $*"; }
ok()    { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
dry()   { echo -e "${YELLOW}[dry-run]${NC} Would: $*"; }
patch() { $DRY_RUN && dry "$*" || { eval "$*" && ok "$*"; }; }

# ── Step 1: Root package.json — pnpm.overrides ────────────────────────────────
info "Step 1 — Kiểm tra pnpm.overrides trong root package.json..."

ROOT_TS_VERSION=$(node -e "console.log(require('./package.json').devDependencies?.typescript || 'NOT_SET')")
ROOT_REACT_TYPES=$(node -e "console.log(require('./package.json').devDependencies?.['@types/react'] || 'NOT_SET')")

# Đọc overrides hiện tại
CURRENT_TS_OVERRIDE=$(node -e "
  const p=require('./package.json');
  console.log(p.pnpm?.overrides?.typescript || 'NONE')
")
CURRENT_REACT_OVERRIDE=$(node -e "
  const p=require('./package.json');
  console.log(p.pnpm?.overrides?.['@types/react'] || 'NONE')
")

# Target values
TARGET_TS="${ROOT_TS_VERSION}"
TARGET_REACT="^18.3.0"   # Pin react 18 để tránh conflict với admin-dashboard (v19 local)
TARGET_REACT_DOM="^18.3.0"

NEED_OVERRIDE_FIX=false
[[ "$CURRENT_TS_OVERRIDE" == "NONE" ]] && NEED_OVERRIDE_FIX=true
[[ "$CURRENT_REACT_OVERRIDE" == "NONE" ]] && NEED_OVERRIDE_FIX=true

if $NEED_OVERRIDE_FIX; then
  info "  Thêm/cập nhật pnpm.overrides..."
  if ! $DRY_RUN; then
    node -e "
      const fs=require('fs');
      const p=JSON.parse(fs.readFileSync('package.json','utf8'));
      if (!p.pnpm) p.pnpm = {};
      if (!p.pnpm.overrides) p.pnpm.overrides = {};
      p.pnpm.overrides.typescript = '${TARGET_TS}';
      p.pnpm.overrides['@types/react'] = '${TARGET_REACT}';
      p.pnpm.overrides['@types/react-dom'] = '${TARGET_REACT_DOM}';
      fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
      console.log('  Updated package.json pnpm.overrides');
    "
    ok "pnpm.overrides patched → typescript=$TARGET_TS, @types/react=$TARGET_REACT"
  else
    dry "Add pnpm.overrides: typescript=$TARGET_TS, @types/react=$TARGET_REACT, @types/react-dom=$TARGET_REACT_DOM"
  fi
else
  ok "pnpm.overrides đã cấu hình (typescript=$CURRENT_TS_OVERRIDE, @types/react=$CURRENT_REACT_OVERRIDE)"
fi

# ── Step 2: Detect TS version đang active ─────────────────────────────────────
ACTIVE_TS=$(node -e "console.log(require('./node_modules/typescript/package.json').version)" 2>/dev/null || echo "UNKNOWN")
ACTIVE_TS_MAJOR=$(echo "$ACTIVE_TS" | cut -d. -f1)

if [[ "$ACTIVE_TS_MAJOR" == "6" ]]; then
  IGNORE_DEPRECATIONS_VALUE="5.5"   # TS6 chấp nhận "5.5" và "6.0"
else
  IGNORE_DEPRECATIONS_VALUE="5.5"   # TS5 chỉ chấp nhận "5.5"
fi

info "  Active TypeScript: $ACTIVE_TS → ignoreDeprecations sẽ dùng '$IGNORE_DEPRECATIONS_VALUE'"

# ── Template tsconfig cho Next.js app ─────────────────────────────────────────
nextjs_tsconfig() {
  local app_dir="$1"
  local src_alias="$2"  # e.g. "./src/*"
  cat <<EOF
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "ignoreDeprecations": "${IGNORE_DEPRECATIONS_VALUE}",
    "types": ["node"],
    "paths": {
      "@/*":            ["${src_alias}"],
      "@ui":            ["../../packages/ui/src/index.ts"],
      "@ui/*":          ["../../packages/ui/src/*"],
      "@lkvip/types":   ["../../packages/types/src/index.ts"],
      "@lkvip/types/*": ["../../packages/types/src/*"]
    }
  },
  "include": ["next-env.d.ts", "css.d.ts", "src/**/*.ts", "src/**/*.tsx", "app/**/*.ts", "app/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "src/App.tsx", "src/main.tsx", "src/vite-env.d.ts", "vite.config.ts", "src/sw.ts"]
}
EOF
}

# ── Template tsconfig cho Vite app ────────────────────────────────────────────
vite_tsconfig() {
  cat <<'EOF'
{
  "extends": "../../tsconfig.frontend.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "ignoreDeprecations": "5.5",
    "paths": {
      "@/*":            ["./src/*"],
      "@ui":            ["../../packages/ui/src/index.ts"],
      "@ui/*":          ["../../packages/ui/src/*"],
      "@lkvip/types":   ["../../packages/types/src/index.ts"],
      "@lkvip/types/*": ["../../packages/types/src/*"],
      "virtual:pwa-register/react": ["../../node_modules/vite-plugin-pwa/react.d.ts"]
    }
  },
  "include": ["src"],
  "exclude": ["src/test", "src/__tests__"]
}
EOF
}

# ── CSS module declaration ─────────────────────────────────────────────────────
CSS_DECLARATION='// CSS module declaration cho Next.js — ngăn TS2882 error
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
'

# ── Step 3: Fix từng app ──────────────────────────────────────────────────────
info "Step 3 — Fix tsconfig.json cho từng app..."

is_nextjs_app() {
  local d="$1"
  [[ -f "$d/next.config.ts" ]] || [[ -f "$d/next.config.js" ]] || [[ -f "$d/next.config.mjs" ]]
}

mapfile -t ALL_APPS < <(
  find "$REPO_ROOT/apps" -maxdepth 1 -mindepth 1 -type d \
    -not -name "external" -not -name "mobile*" \
    | sort
)

for APP_DIR in "${ALL_APPS[@]}"; do
  APP_NAME=$(basename "$APP_DIR")

  # Filter nếu có --app flag
  [[ -n "$FILTER_APP" && "$APP_NAME" != "$FILTER_APP" ]] && continue
  # Skip không có package.json
  [[ ! -f "$APP_DIR/package.json" ]] && continue
  # Skip backend
  [[ "$APP_NAME" == "backend" ]] && continue

  APP_TYPE="vite"
  is_nextjs_app "$APP_DIR" && APP_TYPE="nextjs"

  TSCONFIG="$APP_DIR/tsconfig.json"

  echo ""
  info "  [$APP_NAME] type=$APP_TYPE"

  # ── Next.js apps ───────────────────────────────────────────────────────────
  if [[ "$APP_TYPE" == "nextjs" ]]; then

    # Kiểm tra tsconfig có cần fix không
    NEEDS_FIX=false
    if [[ -f "$TSCONFIG" ]]; then
      # Kiểm tra extends base Vite (không đúng với Next.js)
      extends_val=$(node -e "
        try {
          const raw = require('fs').readFileSync('$TSCONFIG','utf8').replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
          const d=JSON.parse(raw);
          console.log(d.extends || 'NONE');
        } catch(_){ console.log('ERROR'); }
      " 2>/dev/null)
      [[ "$extends_val" == *"tsconfig.frontend.base"* ]] && NEEDS_FIX=true

      # Kiểm tra ignoreDeprecations
      ign=$(node -e "
        try {
          const raw=require('fs').readFileSync('$TSCONFIG','utf8').replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
          const d=JSON.parse(raw);
          console.log(d.compilerOptions?.ignoreDeprecations || 'NONE');
        } catch(_){ console.log('ERROR'); }
      " 2>/dev/null)
      [[ "$ign" == "6.0" && "$ACTIVE_TS_MAJOR" == "5" ]] && NEEDS_FIX=true
    else
      NEEDS_FIX=true
    fi

    if $NEEDS_FIX; then
      warn "  Cần fix tsconfig.json"
      if ! $DRY_RUN; then
        nextjs_tsconfig "$APP_DIR" "./src/*" > "$TSCONFIG"
        ok "  Đã ghi $TSCONFIG"
      else
        dry "  Write Next.js tsconfig.json to $TSCONFIG"
      fi
    else
      ok "  tsconfig.json OK"
    fi

    # Thêm css.d.ts nếu chưa có
    CSS_DTS="$APP_DIR/css.d.ts"
    if [[ ! -f "$CSS_DTS" ]]; then
      if ! $DRY_RUN; then
        echo "$CSS_DECLARATION" > "$CSS_DTS"
        ok "  Tạo $CSS_DTS"
      else
        dry "  Create $CSS_DTS"
      fi
    fi

  # ── Vite apps ──────────────────────────────────────────────────────────────
  else
    if [[ -f "$TSCONFIG" ]]; then
      # Kiểm tra ignoreDeprecations
      ign=$(node -e "
        try {
          const raw=require('fs').readFileSync('$TSCONFIG','utf8').replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
          const d=JSON.parse(raw);
          console.log(d.compilerOptions?.ignoreDeprecations || 'NONE');
        } catch(_){ console.log('ERROR'); }
      " 2>/dev/null)

      if [[ "$ign" != "NONE" && "$ign" != "$IGNORE_DEPRECATIONS_VALUE" ]]; then
        warn "  ignoreDeprecations='$ign' → fix thành '$IGNORE_DEPRECATIONS_VALUE'"
        if ! $DRY_RUN; then
          node -e "
            const fs=require('fs');
            let content=fs.readFileSync('$TSCONFIG','utf8');
            content=content.replace(
              /\"ignoreDeprecations\":\s*\"[^\"]*\"/,
              '\"ignoreDeprecations\": \"${IGNORE_DEPRECATIONS_VALUE}\"'
            );
            fs.writeFileSync('$TSCONFIG', content);
          "
          ok "  Fixed ignoreDeprecations"
        else
          dry "  Replace ignoreDeprecations in $TSCONFIG"
        fi
      else
        ok "  tsconfig.json OK"
      fi
    fi
  fi
done

# ── Step 4: pnpm install để apply overrides ───────────────────────────────────
echo ""
info "Step 4 — Chạy pnpm install để apply overrides..."
if ! $DRY_RUN; then
  pnpm install --frozen-lockfile=false 2>&1 | grep -E "^(Done|Progress|WARN|ERR)" || true
  ok "pnpm install hoàn tất"
else
  dry "pnpm install --frozen-lockfile=false"
fi

# ── Step 5: Verify ────────────────────────────────────────────────────────────
echo ""
info "Step 5 — Verify typecheck cho Next.js apps..."
TYPECHECK_ERRORS=0

for APP_DIR in "${ALL_APPS[@]}"; do
  APP_NAME=$(basename "$APP_DIR")
  [[ -n "$FILTER_APP" && "$APP_NAME" != "$FILTER_APP" ]] && continue
  [[ ! -f "$APP_DIR/package.json" ]] && continue
  [[ "$APP_NAME" == "backend" ]] && continue

  if is_nextjs_app "$APP_DIR"; then
    if ! $DRY_RUN; then
      echo -n "  [$APP_NAME] tsc... "
      result=$(cd "$APP_DIR" && npx tsc --noEmit 2>&1 || true)
      if [[ -z "$result" ]]; then
        echo -e "${GREEN}✓${NC}"
      else
        echo -e "${RED}✗${NC}"
        echo "$result" | head -10 | sed 's/^/    /'
        ((TYPECHECK_ERRORS++))
      fi
    else
      dry "  cd $APP_DIR && npx tsc --noEmit"
    fi
  fi
done

echo ""
if [[ $TYPECHECK_ERRORS -eq 0 ]]; then
  ok "Tất cả Next.js apps typecheck sạch ✅"
else
  warn "$TYPECHECK_ERRORS app(s) còn typecheck errors — kiểm tra thủ công"
fi

echo ""
ok "ts-fix.sh hoàn tất. Chạy 'bash scripts/ts-check.sh' để xem báo cáo."
