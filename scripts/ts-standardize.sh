#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/ts-standardize.sh — LKVIP Monorepo TypeScript Standardization
#
# Chuẩn hóa:
#   1. Tạo/cập nhật tsconfig templates chuẩn
#   2. Validate từng app theo template
#   3. In báo cáo compliance dạng bảng
#   4. Tùy chọn auto-apply fixes
#
# Usage: bash scripts/ts-standardize.sh [--fix] [--report-only]
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

AUTO_FIX=false
REPORT_ONLY=false
for arg in "$@"; do
  [[ "$arg" == "--fix" ]]         && AUTO_FIX=true
  [[ "$arg" == "--report-only" ]] && REPORT_ONLY=true
done

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Chuẩn Next.js tsconfig (required fields) ──────────────────────────────────
# Mỗi field: "path.to.field=expected_value" hoặc "path.to.field=EXISTS"
NEXTJS_REQUIRED=(
  "compilerOptions.skipLibCheck=true"
  "compilerOptions.strict=true"
  "compilerOptions.jsx=preserve"
  "compilerOptions.moduleResolution=bundler"
  "compilerOptions.noEmit=true"
  "compilerOptions.incremental=true"
)
NEXTJS_FORBIDDEN=(
  "extends=*tsconfig.frontend.base*"  # Không được extend Vite base
)

# ── Chuẩn Vite tsconfig (required fields) ─────────────────────────────────────
VITE_REQUIRED=(
  "extends=*tsconfig.frontend.base*"  # Phải extend base
  "compilerOptions.paths.@/*=EXISTS"
)
VITE_FORBIDDEN=(
  "compilerOptions.plugins=*next*"  # Không được có Next.js plugin
)

# ── Package compliance rules ───────────────────────────────────────────────────
PACKAGE_REQUIRED_NEXTJS=(
  "scripts.dev=next dev*"
  "scripts.build=next build"
  "dependencies.next=EXISTS"
)
PACKAGE_FORBIDDEN_NEXTJS=(
  "dependencies.react-router-dom=EXISTS"
  "devDependencies.vite=EXISTS"
  "devDependencies.@vitejs/plugin-react=EXISTS"
)

# ── Helpers ───────────────────────────────────────────────────────────────────
get_tsconfig_field() {
  node -e "
    const fs=require('fs');
    try {
      const raw=fs.readFileSync('$1','utf8').replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
      const d=JSON.parse(raw);
      const keys='$2'.split('.');
      let v=d;
      for(const k of keys) v=v?.[k];
      if(v===undefined||v===null) process.stdout.write('UNDEFINED');
      else if(typeof v==='object') process.stdout.write(JSON.stringify(v));
      else process.stdout.write(String(v));
    } catch(e) { process.stdout.write('PARSE_ERROR'); }
  " 2>/dev/null
}

check_rule() {
  # $1=file, $2=rule string "field.path=expected"
  local file="$1"
  local rule="$2"
  local field="${rule%%=*}"
  local expected="${rule#*=}"
  local actual
  actual=$(get_tsconfig_field "$file" "$field")

  if [[ "$expected" == "EXISTS" ]]; then
    [[ "$actual" != "UNDEFINED" && "$actual" != "PARSE_ERROR" ]] && echo "PASS" || echo "FAIL"
  elif [[ "$expected" == *"*"* ]]; then
    # Glob match
    local pattern="${expected//\*/.*}"
    echo "$actual" | grep -qP "$pattern" && echo "PASS" || echo "FAIL"
  else
    [[ "$actual" == "$expected" ]] && echo "PASS" || echo "FAIL($actual)"
  fi
}

is_nextjs_app() {
  [[ -f "$1/next.config.ts" ]] || [[ -f "$1/next.config.js" ]] || [[ -f "$1/next.config.mjs" ]]
}

# ── Scan apps ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  LKVIP Monorepo — Compliance Standardization Report${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""

mapfile -t ALL_APPS < <(
  find "$REPO_ROOT/apps" -maxdepth 1 -mindepth 1 -type d \
    -not -name "external" -not -name "mobile*" \
    | sort
)

TOTAL=0; COMPLIANT=0; NON_COMPLIANT=0

printf "${BOLD}  %-22s %-8s %-12s %-14s %-10s %s${NC}\n" \
  "App" "Type" "tsconfig" "package.json" "tsc check" "Details"
echo "  ──────────────────────────────────────────────────────────────────────────"

for APP_DIR in "${ALL_APPS[@]}"; do
  APP_NAME=$(basename "$APP_DIR")
  [[ ! -f "$APP_DIR/package.json" ]] && continue
  [[ "$APP_NAME" == "backend" ]] && continue

  ((TOTAL++))

  APP_TYPE="vite"
  is_nextjs_app "$APP_DIR" && APP_TYPE="nextjs"

  TSCONFIG="$APP_DIR/tsconfig.json"
  PKG="$APP_DIR/package.json"

  # ── Check tsconfig compliance ────────────────────────────────────────────
  TSCONFIG_STATUS="✅"
  TS_DETAILS=()

  if [[ -f "$TSCONFIG" ]]; then
    if [[ "$APP_TYPE" == "nextjs" ]]; then
      for rule in "${NEXTJS_REQUIRED[@]}"; do
        result=$(check_rule "$TSCONFIG" "$rule")
        if [[ "$result" != "PASS" ]]; then
          TSCONFIG_STATUS="❌"
          TS_DETAILS+=("tsconfig required: $rule → $result")
        fi
      done
      for rule in "${NEXTJS_FORBIDDEN[@]}"; do
        field="${rule%%=*}"; pattern="${rule#*=}"
        actual=$(get_tsconfig_field "$TSCONFIG" "$field")
        if echo "$actual" | grep -qP "${pattern//\*/.*}" 2>/dev/null; then
          TSCONFIG_STATUS="❌"
          TS_DETAILS+=("tsconfig forbidden: $field=$actual")
        fi
      done
    else
      # Vite: chỉ check ignoreDeprecations value
      ign=$(get_tsconfig_field "$TSCONFIG" "compilerOptions.ignoreDeprecations")
      if [[ "$ign" != "UNDEFINED" && "$ign" != "5.5" && "$ign" != "6.0" ]]; then
        TSCONFIG_STATUS="⚠️"
        TS_DETAILS+=("ignoreDeprecations='$ign' (cần '5.5')")
      fi
    fi
  else
    TSCONFIG_STATUS="⚠️"
    TS_DETAILS+=("tsconfig.json không tìm thấy")
  fi

  # ── Check package.json compliance (Next.js only) ─────────────────────────
  PKG_STATUS="✅"
  PKG_DETAILS=()

  if [[ "$APP_TYPE" == "nextjs" && -f "$PKG" ]]; then
    for rule in "${PACKAGE_FORBIDDEN_NEXTJS[@]}"; do
      field="${rule%%=*}"; expected="${rule#*=}"
      actual=$(node -e "
        try {
          const d=require('$PKG');
          const keys='$field'.split('.');
          let v=d; for(const k of keys) v=v?.[k];
          console.log(v!==undefined?'EXISTS':'NONE');
        }catch(_){console.log('ERROR');}
      " 2>/dev/null)
      if [[ "$actual" == "EXISTS" ]]; then
        PKG_STATUS="❌"
        PKG_DETAILS+=("forbidden dep: $field")
      fi
    done
    # Check next dep exists
    has_next=$(node -e "
      const d=require('$PKG');
      console.log((d.dependencies?.next || d.devDependencies?.next) ? 'YES' : 'NO');
    " 2>/dev/null)
    if [[ "$has_next" == "NO" ]]; then
      PKG_STATUS="❌"
      PKG_DETAILS+=("missing: dependencies.next")
    fi
  fi

  # ── tsc check ───────────────────────────────────────────────────────────
  TSC_STATUS="✅"
  TSC_DETAILS=()
  if [[ -f "$TSCONFIG" && "$APP_TYPE" == "nextjs" ]]; then
    tsc_output=$(cd "$APP_DIR" && npx tsc --noEmit 2>&1 || true)
    if [[ -n "$tsc_output" ]]; then
      err_count=$(echo "$tsc_output" | grep -c "error TS" || true)
      if [[ $err_count -gt 0 ]]; then
        TSC_STATUS="❌"
        TSC_DETAILS+=("$err_count TS errors")
        # Show first error
        first_err=$(echo "$tsc_output" | grep "error TS" | head -1 | sed 's/^.*error TS/TS/')
        TSC_DETAILS+=("→ $first_err")
      fi
    fi
  elif [[ "$APP_TYPE" == "vite" ]]; then
    TSC_STATUS="⏭️"
    TSC_DETAILS+=("(Vite — skip)")
  fi

  # ── Overall status ────────────────────────────────────────────────────────
  OVERALL="✅"
  [[ "$TSCONFIG_STATUS" == "❌" || "$PKG_STATUS" == "❌" || "$TSC_STATUS" == "❌" ]] && OVERALL="❌"
  [[ "$OVERALL" == "✅" && ("$TSCONFIG_STATUS" == "⚠️" || "$PKG_STATUS" == "⚠️") ]] && OVERALL="⚠️"

  [[ "$OVERALL" == "✅" ]] && ((COMPLIANT++)) || ((NON_COMPLIANT++))

  ALL_DETAILS=("${TS_DETAILS[@]:-}" "${PKG_DETAILS[@]:-}" "${TSC_DETAILS[@]:-}")
  DETAILS_STR="${ALL_DETAILS[*]:-}"
  [[ -z "$DETAILS_STR" ]] && DETAILS_STR="All checks passed"

  printf "  %-22s %-8s %-12s %-14s %-10s %s\n" \
    "$APP_NAME" "$APP_TYPE" "$TSCONFIG_STATUS" "$PKG_STATUS" "$TSC_STATUS" "$DETAILS_STR"
done

echo ""
echo -e "  ${BOLD}Summary:${NC} $TOTAL apps scanned → ${GREEN}$COMPLIANT compliant${NC}  ${RED}$NON_COMPLIANT non-compliant${NC}"
echo ""

if $AUTO_FIX && [[ $NON_COMPLIANT -gt 0 ]]; then
  echo -e "${CYAN}Auto-fixing...${NC}"
  bash "$REPO_ROOT/scripts/ts-fix.sh"
fi

[[ $NON_COMPLIANT -eq 0 ]] && exit 0 || exit 1
