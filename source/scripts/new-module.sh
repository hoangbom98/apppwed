#!/usr/bin/env bash
# =============================================================================
#  new-module.sh — Scaffold a new KJC backend module
#
#  Usage:
#    bash source/scripts/new-module.sh <module-name>
#
#  Example:
#    bash source/scripts/new-module.sh loyalty2
#
#  What it does:
#    1. Creates source/backend/src/modules/<name>/ with standard sub-dirs
#    2. Generates index.js, routes/index.js, controllers/index.js, services/index.js
#    3. Prints next steps (DB schema, server.js registration)
# =============================================================================
set -euo pipefail

MODULE="${1:-}"

if [[ -z "$MODULE" ]]; then
  echo "Usage: bash source/scripts/new-module.sh <module-name>"
  exit 1
fi

# Derive PascalCase name (e.g. my-module → MyModule)
PASCAL="$(echo "$MODULE" | sed -E 's/(^|-)([a-z])/\U\2/g')"

# Base dir
BASE="$(cd "$(dirname "$0")/.." && pwd)"
MODULES_DIR="$BASE/backend/src/modules/$MODULE"

if [[ -d "$MODULES_DIR" ]]; then
  echo "❌  Module '$MODULE' already exists at $MODULES_DIR"
  exit 1
fi

echo "📦  Creating module: $MODULE"

# Create directory tree
mkdir -p "$MODULES_DIR"/{controllers,routes,services,validators}

# ── routes/index.js ──────────────────────────────────────────────────────────
cat > "$MODULES_DIR/routes/index.js" << EOF
'use strict';
const router = require('express').Router();
const { auth }               = require('../../../shared/middlewares/auth');
const projectAccessGuard     = require('../../../shared/middlewares/projectAccessGuard');

// Mount shared sub-routes (auth, wallet, etc.) — remove what is not needed
// router.use('/auth',    require('../../../shared/routes/auth.routes'));
// router.use('/wallet',  require('../../../shared/routes/wallet.routes'));

// Module-specific routes
router.use(auth, projectAccessGuard);
router.use('/', require('./${MODULE}.routes'));

module.exports = router;
EOF

# ── routes/<name>.routes.js ──────────────────────────────────────────────────
cat > "$MODULES_DIR/routes/${MODULE}.routes.js" << EOF
'use strict';
const router     = require('express').Router();
const controller = require('../controllers/${MODULE}Controller');

router.get('/', controller.list);
router.get('/:id', controller.getOne);

module.exports = router;
EOF

# ── controllers/<name>Controller.js ─────────────────────────────────────────
cat > "$MODULES_DIR/controllers/${MODULE}Controller.js" << EOF
'use strict';
const { ok, notFound, serverError } = require('../../../shared/utils/response');
const ${PASCAL}Service = require('../services/${MODULE}Service');

exports.list = async (req, res, next) => {
  try {
    const data = await ${PASCAL}Service.list(req.prisma, req.user);
    ok(res, data);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await ${PASCAL}Service.findById(req.prisma, req.params.id);
    if (!item) return notFound(res);
    ok(res, item);
  } catch (err) { next(err); }
};
EOF

# ── services/<name>Service.js ─────────────────────────────────────────────────
cat > "$MODULES_DIR/services/${MODULE}Service.js" << EOF
'use strict';
/**
 * ${PASCAL}Service — business logic for the ${MODULE} module.
 *
 * All DB access uses the prisma client passed in (req.prisma).
 * This keeps the service testable without a live DB connection.
 */

exports.list = async (prisma, _user) => {
  // TODO: replace with actual Prisma model
  return [];
};

exports.findById = async (prisma, id) => {
  // TODO: replace with actual Prisma model
  return null;
};
EOF

# ── index.js (module barrel) ─────────────────────────────────────────────────
cat > "$MODULES_DIR/index.js" << EOF
'use strict';
module.exports = require('./routes');
EOF

echo ""
echo "✅  Module '$MODULE' created at $MODULES_DIR"
echo ""
echo "Next steps:"
echo "  1.  Create the Prisma schema:   source/backend/prisma/${MODULE}/schema.prisma"
echo "      (Only if this module needs its own DB — otherwise use an existing project's DB)"
echo ""
echo "  2.  Add the route mount in server.js (or the relevant module's routes/index.js):"
echo "      app.use('/api/${MODULE}', require('./src/modules/${MODULE}'));"
echo ""
echo "  3.  If new DB: add ${MODULE^^}_DATABASE_URL to .env and databases.js PATH_MAP."
echo ""
echo "  4.  Run: pnpm --filter group-backend run dev"
