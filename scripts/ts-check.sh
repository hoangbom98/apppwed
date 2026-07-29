#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/ts-check.sh — LKVIP Monorepo TypeScript Health Check
#
# Phát hiện:
#   1. TypeScript version conflict (local vs workspace root)
#   2. @types/react / @types/react-dom version mismatch
#   3. tsconfig.json issues cho từng loại app
#   4. pnpm hoisting conflict
#   5. Binary tsc đang dùng của từng app
#
# Usage: bash scripts/ts-check.sh [--json] [--fail-on-error]
#   --json          : in output dạng JSON thay vì bảng
#   --fail-on-error : exit code 1 nếu có lỗi (dùng trong CI)
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Flags ─────────────────────────────────────────────────────────────────────
FLAG_JSON=false
FLAG_FAIL=false
for arg in "$@"; do
  [[ "$arg" == "--json" ]]          && FLAG_JSON=true
  [[ "$arg" == "--fail-on-error" ]] && FLAG_FAIL=true
done

# ── Colors ────────────────────────────────────────────────────────────────────
if $FLAG_JSON; then
  GREEN=""; RED=""; YELLOW=""; CYAN=""; BOLD=""; NC=""
else
  GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
pkg_version() {
  # $1 = app_dir, $2 = package_name
  node -e "
    const paths = [
      '$1/node_modules/$2/package.json',
      '${REPO_ROOT}/node_modules/$2/package.json'
    ];
    for (const p of paths) {
      try { const r=require(p); process.stdout.write(r.version); process.exit(0); } catch(_){}
    }
    process.stdout.write('NOT_FOUND');
  " 2>/dev/null
}

local_pkg_version() {
  # Chỉ kiểm tra local node_modules (không fallback root)
  node -e "
    try {
      const r=require('$1/node_modules/$2/package.json');
      process.stdout.write(r.version);
    } catch(_) { process.stdout.write('NONE'); }
  " 2>/dev/null
}

tsconfig_field() {
  # $1=tsconfig path, $2=field (dot-path e.g. compilerOptions.moduleResolution)
  node -e "
    const fs=require('fs'), path=require('path');
    try {
      // Strip JSON comments (tsconfig allows them)
      const raw = fs.readFileSync('$1','utf8').replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
      const d = JSON.parse(raw);
      const keys = '$2'.split('.');
      let v = d;
      for (const k of keys) v = v?.[k];
      process.stdout.write(v === undefined ? 'UNDEFINED' : String(v));
    } catch(e) { process.stdout.write('PARSE_ERROR'); }
  " 2>/dev/null
}

which_tsc() {
  # Trả về path của tsc binary app sẽ dùng
  local app_dir="$1"
  if [[ -f "$app_dir/node_modules/.bin/tsc" ]]; then
    echo "LOCAL ($app_dir/node_modules/.bin/tsc)"
  elif [[ -f "$REPO_ROOT/node_modules/.bin/tsc" ]]; then
    echo "ROOT (${REPO_ROOT}/node_modules/.bin/tsc)"
  else
    echo "SYSTEM ($(which tsc 2>/dev/null || echo 'NOT FOUND'))"
  fi
}

is_nextjs_app() {
  local app_dir="$1"
  [[ -f "$app_dir/next.config.ts" ]] || [[ -f "$app_dir/next.config.js" ]] || [[ -f "$app_dir/next.config.mjs" ]]
}

# ── Lấy danh sách apps ────────────────────────────────────────────────────────
mapfile -t ALL_APPS < <(
  find "$REPO_ROOT/apps" -maxdepth 1 -mindepth 1 -type d \
    -not -name "external" -not -name "mobile*" \
    | sort
)

# ── Thu thập data ─────────────────────────────────────────────────────────────
declare -a RESULTS=()
ERRORS=0
WARNINGS=0

# Root versions
ROOT_TS=$(local_pkg_version "$REPO_ROOT" "typescript")
ROOT_REACT_TYPES=$(local_pkg_version "$REPO_ROOT" "@types/react")
ROOT_REACT_DOM_TYPES=$(local_pkg_version "$REPO_ROOT" "@types/react-dom")
ROOT_TSC=$(which_tsc "$REPO_ROOT")

for APP_DIR in "${ALL_APPS[@]}"; do
  APP_NAME=$(basename "$APP_DIR")
  PKG_JSON="$APP_DIR/package.json"
  TSCONFIG="$APP_DIR/tsconfig.json"

  # Skip apps không có package.json
  [[ ! -f "$PKG_JSON" ]] && continue
  # Skip backend
  [[ "$APP_NAME" == "backend" ]] && continue

  # Phát hiện loại app
  APP_TYPE="vite"
  is_nextjs_app "$APP_DIR" && APP_TYPE="nextjs"
  [[ "$APP_NAME" == "lkvipgroup-portal" ]] && APP_TYPE="nextjs"

  # Versions
  LOCAL_TS=$(local_pkg_version "$APP_DIR" "typescript")
  LOCAL_REACT=$(local_pkg_version "$APP_DIR" "@types/react")
  LOCAL_REACT_DOM=$(local_pkg_version "$APP_DIR" "@types/react-dom")

  # tsc binary
  TSC_USED=$(which_tsc "$APP_DIR")
  TSC_VERSION=$(node -e "
    const paths = ['$APP_DIR/node_modules/.bin/tsc', '$REPO_ROOT/node_modules/.bin/tsc'];
    for (const p of paths) {
      if (require('fs').existsSync(p)) {
        try {
          const {execSync}=require('child_process');
          process.stdout.write(execSync(p+' --version',{encoding:'utf8'}).trim());
          process.exit(0);
        } catch(_){}
      }
    }
    process.stdout.write('UNKNOWN');
  " 2>/dev/null)

  # tsconfig analysis
  ISSUES=()
  STATUS="OK"

  if [[ -f "$TSCONFIG" ]]; then
    MODULE_RES=$(tsconfig_field "$TSCONFIG" "compilerOptions.moduleResolution")
    IGNORE_DEPR=$(tsconfig_field "$TSCONFIG" "compilerOptions.ignoreDeprecations")
    BASE_URL=$(tsconfig_field "$TSCONFIG" "compilerOptions.baseUrl")
    EXTENDS=$(tsconfig_field "$TSCONFIG" "extends")
    PLUGINS=$(tsconfig_field "$TSCONFIG" "compilerOptions.plugins")

    # Check 1: Next.js app phải dùng moduleResolution bundler/node16/node
    if [[ "$APP_TYPE" == "nextjs" ]]; then
      if [[ "$MODULE_RES" == "UNDEFINED" ]]; then
        ISSUES+=("❌ Next.js app thiếu moduleResolution")
        STATUS="ERROR"; ((ERRORS++))
      fi
      # Check plugins có next không
      if [[ "$PLUGINS" != *"next"* ]]; then
        ISSUES+=("⚠️  tsconfig thiếu plugin next")
        STATUS="${STATUS:-WARN}"; ((WARNINGS++))
      fi
    fi

    # Check 2: ignoreDeprecations value
    if [[ "$IGNORE_DEPR" != "UNDEFINED" && "$IGNORE_DEPR" != "PARSE_ERROR" ]]; then
      TS_MAJOR=$(echo "$TSC_VERSION" | grep -oP '\d+' | head -1)
      if [[ "$TS_MAJOR" == "6" && "$IGNORE_DEPR" != "5.5" && "$IGNORE_DEPR" != "6.0" ]]; then
        ISSUES+=("⚠️  ignoreDeprecations='$IGNORE_DEPR' (TS6 cần '5.5' hoặc '6.0')")
        [[ "$STATUS" == "OK" ]] && STATUS="WARN"; ((WARNINGS++))
      elif [[ "$TS_MAJOR" == "5" && "$IGNORE_DEPR" == "6.0" ]]; then
        ISSUES+=("❌ ignoreDeprecations='6.0' không valid với TS5 ($TSC_VERSION)")
        STATUS="ERROR"; ((ERRORS++))
      fi
    fi

    # Check 3: Vite app có dùng Next.js plugin không
    if [[ "$APP_TYPE" == "vite" && "$PLUGINS" == *"next"* ]]; then
      ISSUES+=("⚠️  Vite app có Next.js plugin trong tsconfig")
      [[ "$STATUS" == "OK" ]] && STATUS="WARN"; ((WARNINGS++))
    fi
  else
    ISSUES+=("⚠️  Không tìm thấy tsconfig.json")
    [[ "$STATUS" == "OK" ]] && STATUS="WARN"; ((WARNINGS++))
  fi

  # Check 4: local TS conflict
  if [[ "$LOCAL_TS" != "NONE" ]]; then
    if [[ "$LOCAL_TS" != "$ROOT_TS" ]]; then
      ISSUES+=("❌ Local TypeScript $LOCAL_TS ≠ Root $ROOT_TS (hoisting conflict)")
      STATUS="ERROR"; ((ERRORS++))
    fi
  fi

  # Check 5: @types/react conflict
  EFFECTIVE_REACT="$ROOT_REACT_TYPES"
  [[ "$LOCAL_REACT" != "NONE" ]] && EFFECTIVE_REACT="$LOCAL_REACT"
  ROOT_REACT_MAJOR=$(echo "$ROOT_REACT_TYPES" | cut -d. -f1)
  EFF_REACT_MAJOR=$(echo "$EFFECTIVE_REACT" | cut -d. -f1)
  if [[ "$LOCAL_REACT" != "NONE" && "$LOCAL_REACT" != "$ROOT_REACT_TYPES" ]]; then
    ISSUES+=("⚠️  Local @types/react $LOCAL_REACT ≠ Root $ROOT_REACT_TYPES")
    [[ "$STATUS" == "OK" ]] && STATUS="WARN"; ((WARNINGS++))
  fi
  if [[ "$ROOT_REACT_MAJOR" != "$EFF_REACT_MAJOR" ]]; then
    ISSUES+=("❌ @types/react major mismatch ($EFFECTIVE_REACT vs root $ROOT_REACT_TYPES)")
    STATUS="ERROR"; ((ERRORS++))
  fi

  # Format issues string
  ISSUES_STR="${ISSUES[*]:-✅ Không có}"

  RESULTS+=("$APP_NAME|$APP_TYPE|$TSC_VERSION|$EFFECTIVE_REACT|$TSC_USED|$STATUS|$ISSUES_STR")
done

# ── Output ─────────────────────────────────────────────────────────────────────
if $FLAG_JSON; then
  echo "{"
  echo "  \"scanned_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"root\": {"
  echo "    \"typescript\": \"$ROOT_TS\","
  echo "    \"types_react\": \"$ROOT_REACT_TYPES\","
  echo "    \"types_react_dom\": \"$ROOT_REACT_DOM_TYPES\""
  echo "  },"
  echo "  \"summary\": { \"errors\": $ERRORS, \"warnings\": $WARNINGS },"
  echo "  \"apps\": ["
  first=true
  for row in "${RESULTS[@]}"; do
    IFS='|' read -r name type ts_ver react_types tsc_bin status issues <<< "$row"
    $first || echo "    ,"
    first=false
    printf '    {"app":"%s","type":"%s","ts_version":"%s","react_types":"%s","tsc_binary":"%s","status":"%s","issues":"%s"}\n' \
      "$name" "$type" "$ts_ver" "$react_types" "$tsc_bin" "$status" "${issues//\"/\\\"}"
  done
  echo "  ]"
  echo "}"
else
  echo ""
  echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}  LKVIP Monorepo — TypeScript Health Report${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  Root TypeScript  : ${BOLD}${ROOT_TS}${NC}"
  echo -e "  Root @types/react: ${BOLD}${ROOT_REACT_TYPES}${NC}"
  echo -e "  Root tsc binary  : ${ROOT_TSC}"
  echo ""
  printf "${BOLD}  %-22s %-8s %-16s %-14s %-10s %s${NC}\n" \
    "App" "Type" "TS Version" "@types/react" "Status" "Issues"
  echo "  ─────────────────────────────────────────────────────────────────────"
  for row in "${RESULTS[@]}"; do
    IFS='|' read -r name type ts_ver react_types tsc_bin status issues <<< "$row"
    case "$status" in
      OK)    color="$GREEN" ;;
      WARN)  color="$YELLOW" ;;
      ERROR) color="$RED" ;;
      *)     color="$NC" ;;
    esac
    ts_display=$(echo "$ts_ver" | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "$ts_ver")
    printf "  %-22s %-8s %-16s %-14s ${color}%-10s${NC} %s\n" \
      "$name" "$type" "$ts_display" "$react_types" "$status" "$issues"
  done
  echo ""
  echo -e "  Summary: ${RED}${ERRORS} errors${NC}  ${YELLOW}${WARNINGS} warnings${NC}"
  echo ""
fi

# Exit code cho CI
if $FLAG_FAIL && [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}❌ Phát hiện $ERRORS lỗi. Chạy 'bash scripts/ts-fix.sh' để tự động fix.${NC}"
  exit 1
fi
exit 0
