# @lkvip/constants — Shared Platform Constants

Centralized constants for the LKVIP GROUP (Node.js / CommonJS). No build step — source-direct.

## Install (pnpm workspace)

Already declared in `pnpm-workspace.yaml`. Reference from any backend file:

```js
const { PROJECT_IDS, USER_ROLES, HTTP_STATUS, ERROR_CODES } = require('@lkvip/constants');
```

---

## Modules

### `projects` — Project & app identifiers
```js
const { PROJECT_IDS, ALL_FRONTEND_APPS, APP_PORTS, ROUTE_PROJECT_MAP } = require('@lkvip/constants');

PROJECT_IDS        // ['hub', 'game', 'trade', 'dating', 'sports', 'admin']
ALL_FRONTEND_APPS  // ['hub', 'game', 'trade', 'dating', 'sports', 'admin-dashboard']
APP_PORTS          // { backend: 5000, hub: 5173, game: 5174, ... }
ROUTE_PROJECT_MAP  // { '/api/hub': 'hub', '/api/game': 'game', ... }
```

### `roles` — User roles & permissions
```js
const { USER_ROLES, ADMIN_ROLES, ROLE_LEVEL, isAdminRole, roleAtLeast } = require('@lkvip/constants');

USER_ROLES         // ['user', 'vip', 'agent', 'admin', 'super_admin']
ADMIN_ROLES        // ['admin', 'super_admin']
ROLE_LEVEL         // { user: 1, vip: 2, agent: 3, admin: 4, super_admin: 5 }

isAdminRole('admin')             // → true
roleAtLeast('super_admin', 'admin') // → true (super_admin ≥ admin)
```

### `errors` — Error codes & HTTP status
```js
const { ERROR_CODES, HTTP_STATUS } = require('@lkvip/constants');

ERROR_CODES.AUTH_TOKEN_EXPIRED    // 'AUTH_TOKEN_EXPIRED'
ERROR_CODES.USER_NOT_FOUND        // 'USER_NOT_FOUND'
ERROR_CODES.WALLET_INSUFFICIENT_FUNDS // 'WALLET_INSUFFICIENT_FUNDS'

HTTP_STATUS.OK           // 200
HTTP_STATUS.UNAUTHORIZED // 401
HTTP_STATUS.NOT_FOUND    // 404
```

### `currencies` — Currency & payment config
```js
const { CURRENCY_CODES, PAYMENT_GATEWAY_CODES, DEFAULT_LIMITS, GATEWAY_MIN_AMOUNT } = require('@lkvip/constants');

CURRENCY_CODES           // ['VND', 'USD', 'COIN', 'DIAMOND']
PAYMENT_GATEWAY_CODES    // ['momo', 'zalopay', 'vnpay', ...]
DEFAULT_LIMITS.deposit   // { min: 10000, max: 500000000 }
GATEWAY_MIN_AMOUNT.momo  // 10000
```

---

## Adding a new constant

1. Place it in the appropriate file: `src/projects.js`, `src/roles.js`, `src/errors.js`, or `src/currencies.js`
2. Export it from that file
3. The barrel `src/index.js` already does `...require('./yourfile')` via spread — **no barrel update needed**
4. Update this README with example usage
