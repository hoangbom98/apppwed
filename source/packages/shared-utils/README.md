# @kjc/utils — Shared Backend Utilities

Pure-function utilities for the KJC backend (Node.js / CommonJS). No build step — source-direct.

## Install (pnpm workspace)

Already declared in `pnpm-workspace.yaml`. Reference it from any backend file:

```js
const { slugify, isEmail, formatVND, addDays } = require('@kjc/utils');
```

> Resolved via pnpm workspace symlink: `node_modules/@kjc/utils → ../../packages/shared-utils`

---

## Modules

### `slugify` — URL-safe slugs
```js
const { slugify } = require('@kjc/utils');
slugify('Thể thao Bóng Đá')   // → 'the-thao-bong-da'
slugify('Hello World', { separator: '_' }) // → 'hello_world'
```

### `strings` — String helpers
```js
const { truncate, mask, randomCode, normalizePhone, toSnakeCase } = require('@kjc/utils');
truncate('Very long text...', 20)   // → 'Very long text......'
mask('0987654321', 3)               // → '098****321'
randomCode(8)                       // → 'K3MX5PQY'
normalizePhone('+84987654321')      // → '0987654321'
```

### `dates` — Date/time helpers
```js
const { addDays, addMinutes, isPast, formatVNDateTime } = require('@kjc/utils');
addDays(30)          // Date 30 days from now
addMinutes(5)        // Date 5 minutes from now
isPast('2020-01-01') // → true
formatVNDateTime(new Date()) // → '25/07/2025 14:30:00'
```

### `validators` — Input validation
```js
const { isEmail, isPassword, isPhone, isValidAmount, missingFields } = require('@kjc/utils');
isEmail('user@example.com')    // → true
isPassword('secret')           // → true (≥6 chars)
isValidAmount(50_000, 10_000)  // → true
missingFields({ a: 1 }, ['a', 'b']) // → ['b']
```

### `numbers` — Number helpers
```js
const { formatVND, clamp, round, pct, safeInt } = require('@kjc/utils');
formatVND(1_500_000)   // → '1.500.000 ₫'
clamp(150, 0, 100)     // → 100
round(3.14159, 2)      // → 3.14
pct(25, 200)           // → 12.5
```
