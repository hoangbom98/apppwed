#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/migrate-all.sh — Run Prisma migrations for ALL 6 databases
#
# Usage:
#   bash scripts/migrate-all.sh              # dev (prisma migrate dev)
#   bash scripts/migrate-all.sh --deploy     # production (prisma migrate deploy)
#   bash scripts/migrate-all.sh --status     # check migration status
#
# Run from the workspace root: source/
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
MODULES=(admin hub game trade dating sports)

ACTION="dev"
if [[ "$1" == "--deploy" ]]; then ACTION="deploy"; fi
if [[ "$1" == "--status" ]]; then ACTION="status"; fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🗄️  Prisma Migration — action: ${ACTION}${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

FAILED=0

for db in "${MODULES[@]}"; do
  SCHEMA="prisma/${db}/schema.prisma"
  echo -e "\n${YELLOW}▶  ${db} — ${SCHEMA}${NC}"

  case "$ACTION" in
    deploy)
      npx prisma migrate deploy --schema="$SCHEMA" --cwd="$BACKEND_DIR" \
        && echo -e "${GREEN}  ✓ ${db} deployed${NC}" \
        || { echo -e "${RED}  ✗ ${db} FAILED${NC}"; FAILED=$((FAILED+1)); }
      ;;
    status)
      npx prisma migrate status --schema="$SCHEMA" --cwd="$BACKEND_DIR" \
        && echo -e "${GREEN}  ✓ ${db} status OK${NC}" \
        || { echo -e "${RED}  ✗ ${db} status error${NC}"; FAILED=$((FAILED+1)); }
      ;;
    dev|*)
      npx prisma migrate dev --schema="$SCHEMA" --cwd="$BACKEND_DIR" \
        && echo -e "${GREEN}  ✓ ${db} migrated${NC}" \
        || { echo -e "${RED}  ✗ ${db} FAILED${NC}"; FAILED=$((FAILED+1)); }
      ;;
  esac
done

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
else
  echo -e "${RED}❌ ${FAILED} migration(s) FAILED. Check output above.${NC}"
  exit 1
fi
