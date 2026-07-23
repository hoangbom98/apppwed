#!/usr/bin/env bash
# =============================================================================
#  build-mobile.sh — Build & sync Capacitor apps for iOS/Android
#
#  Builds: Hub (@lkvip/hub), Game (@lkvip/game), Dating (@lkvip/dating)
#
#  Usage:
#    bash source/scripts/build-mobile.sh              # build all 3 apps
#    bash source/scripts/build-mobile.sh hub          # build hub only
#    bash source/scripts/build-mobile.sh game dating  # build game + dating
#
#  Prerequisites:
#    - Xcode (macOS only, for iOS)
#    - Android Studio + ANDROID_HOME (for Android)
#    - pnpm installed (workspace root)
#
#  After running this script:
#    - iOS:     open source/frontend/<app>/ios/App/App.xcworkspace in Xcode
#    - Android: open source/frontend/<app>/android in Android Studio
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$SOURCE_DIR/frontend"

# Colours
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'; BOLD='\033[1m'

log_ok()    { echo -e "${GREEN}✓${RESET} $1"; }
log_warn()  { echo -e "${YELLOW}⚠${RESET} $1"; }
log_error() { echo -e "${RED}✗${RESET} $1"; }
log_step()  { echo -e "\n${BOLD}── $1 ──────────────────────────────────${RESET}"; }

# All Capacitor apps
ALL_APPS=(hub game dating)

# Determine which apps to build
if [[ $# -gt 0 ]]; then
  APPS=("$@")
else
  APPS=("${ALL_APPS[@]}")
fi

echo -e "${BOLD}LKVIP GROUP Mobile Build Script${RESET}"
echo "Apps to build: ${APPS[*]}"
echo "Source dir:    $SOURCE_DIR"

# ── Build loop ────────────────────────────────────────────────────────────────
for APP in "${APPS[@]}"; do
  APP_DIR="$FRONTEND_DIR/$APP"

  # Validate app name
  if [[ ! " ${ALL_APPS[*]} " =~ " ${APP} " ]]; then
    log_error "Unknown app: '$APP'. Valid apps: ${ALL_APPS[*]}"
    exit 1
  fi

  if [[ ! -d "$APP_DIR" ]]; then
    log_error "App directory not found: $APP_DIR"
    exit 1
  fi

  log_step "Building $APP"

  # 1. Vite build
  echo "  [1/2] Building Vite SPA..."
  cd "$SOURCE_DIR"
  pnpm --filter "@lkvip/$APP" run build
  log_ok "Vite build complete for $APP"

  # 2. Capacitor sync
  echo "  [2/2] Syncing Capacitor..."
  pnpm --filter "@lkvip/$APP" run cap:sync 2>/dev/null || {
    log_warn "cap:sync not found for $APP — running 'npx cap sync' directly"
    cd "$APP_DIR" && npx cap sync
  }
  log_ok "Capacitor sync complete for $APP"

  echo ""
  echo -e "${GREEN}✓ $APP build complete${RESET}"
  echo "  iOS:     open $APP_DIR/ios/App/App.xcworkspace"
  echo "  Android: open $APP_DIR/android in Android Studio"
done

echo ""
log_ok "All apps built successfully: ${APPS[*]}"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo "  iOS release:     See MOBILE_BUILD_GUIDE.md → iOS section"
echo "  Android release: See MOBILE_BUILD_GUIDE.md → Android section"
