#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/seed-all.sh — Run database seeds for ALL sub-projects
#
# Usage:
#   bash scripts/seed-all.sh              # seed all (default order)
#   bash scripts/seed-all.sh --force      # force re-seed (SEED_FORCE=true)
#   bash scripts/seed-all.sh hub game     # seed only specific modules
#
# Run from the workspace root: source/
# Execution order: admin → ui-config → payment-gateways → hub → game → lkvip → dating → sports
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"

# Detect --force flag
FORCE=""
FILTER_MODULES=()
for arg in "$@"; do
  if [[ "$arg" == "--force" ]]; then
    FORCE="true"
  else
    FILTER_MODULES+=("$arg")
  fi
done

if [[ -n "$FORCE" ]]; then
  export SEED_FORCE=true
  echo -e "${YELLOW}⚠️  SEED_FORCE=true — existing seed data will be overwritten${NC}"
fi

# Default execution order
DEFAULT_ORDER=(admin ui-config payment feature-flags hub game lkvip dating sports)

# Determine which seeds to run
if [[ ${#FILTER_MODULES[@]} -gt 0 ]]; then
  RUN_MODULES=("${FILTER_MODULES[@]}")
else
  RUN_MODULES=("${DEFAULT_ORDER[@]}")
fi

# Map friendly names to seed file names
declare -A SEED_FILE_MAP=(
  [admin]="admin.seed.ts"
  [ui-config]="ui-config.seed.ts"
  [payment]="payment-gateways.seed.ts"
  [feature]="feature-flags.seed.ts"
  [hub]="hub.seed.ts"
  [game]="game.seed.ts"
  [lkvip]="lkvip.seed.ts"
  [dating]="dating.seed.ts"
  [sports]="sports.seed.ts"
  [trade]="trade.seed.ts"
  [aggregators]="gameAggregators.seed.ts"
  [demo]="demo.seed.ts"
)

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🌱 Database Seeding — modules: ${RUN_MODULES[*]}${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

FAILED=0

cd "$BACKEND_DIR"

for module in "${RUN_MODULES[@]}"; do
  FILE="${SEED_FILE_MAP[$module]}"
  if [[ -z "$FILE" ]]; then
    echo -e "${YELLOW}⚠️  Unknown module: ${module} — skipping${NC}"
    continue
  fi

  SEED_PATH="prisma/seeds/$FILE"
  if [[ ! -f "$SEED_PATH" ]]; then
    echo -e "${YELLOW}⚠️  Seed file not found: ${SEED_PATH} — skipping${NC}"
    continue
  fi

  echo -e "\n${YELLOW}▶  Seeding ${module} (${FILE})...${NC}"
  npx tsx "$SEED_PATH" \
    && echo -e "${GREEN}  ✓ ${module} seeded${NC}" \
    || { echo -e "${RED}  ✗ ${module} FAILED${NC}"; FAILED=$((FAILED+1)); }
done

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ All seeds completed successfully!${NC}"
else
  echo -e "${RED}❌ ${FAILED} seed(s) FAILED. Check output above.${NC}"
  exit 1
fi
