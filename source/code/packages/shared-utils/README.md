# @lkvip/utils — Shared Backend Utilities

Pure-function utilities for the LKVIP backend (Node.js / CommonJS). No build step — source-direct.

## Install (pnpm workspace)

Already declared in `pnpm-workspace.yaml`. Reference from any backend file:

```js
const { slugify, isEmail, formatVND, addDays, parsePaginationQuery, generateOTP } = require('@lkvip/utils');
```

> Resolved via pnpm workspace symlink: `node_modules/@lkvip/utils → ../../packages/shared-utils`

---

## Modules

### `slugify` — URL-safe slugs
```js
slugify('Thể thao Bóng Đá')               // → 'the-thao-bong-da'
slugify('Hello World', { separator: '_' }) // → 'hello_world'
```

### `strings` — String helpers
```js
truncate('Very long text here...', 20) // → 'Very long text here…'
mask('0987654321', 3)                  // → '098****321'
randomCode(8)                          // → 'K3MX5PQY'
normalizePhone('+84987654321')         // → '0987654321'
toSnakeCase('getUserById')             // → 'get_user_by_id'
```

### `dates` — Date/time helpers
```js
addDays(30)                   // Date 30 days from now
addMinutes(5)                 // Date 5 minutes from now
isPast('2020-01-01')          // → true
startOfDay()                  // today at 00:00:00.000
formatVNDateTime(new Date())  // → '25/07/2025 14:30:00'
formatDuration(3661)          // → '01:01:01'
```

### `validators` — Input validation
```js
isEmail('user@example.com')      // → true
isPassword('secret123')          // → true (≥6 chars)
isUsername('john_doe')           // → true (3–30 alphanumeric/_)
isPhone('0987654321')            // → true (10–12 digits)
isValidAmount(50_000, 10_000)    // → true
missingFields({ a: 1 }, ['a', 'b']) // → ['b']
```

### `numbers` — Number helpers
```js
formatVND(1_500_000)   // → '1.500.000 ₫'
clamp(150, 0, 100)     // → 100
round(3.14159, 2)      // → 3.14
pct(25, 200)           // → 12.5
safeInt('42abc', 0)    // → 42
```

### `pagination` — Paginated query helpers
```js
// In a controller:
const { page, limit, skip } = parsePaginationQuery(req.query);
// → { page: 1, limit: 20, skip: 0 }

const total = await prisma.user.count();
const data  = await prisma.user.findMany({ skip, take: limit });
const meta  = buildPagination(page, limit, total);
// → { meta: { page: 1, limit: 20, total: 157, pages: 8, hasPrev: false, hasNext: true } }

// Custom limits:
parsePaginationQuery(req.query, { defaultLimit: 10, maxLimit: 50 })
```

### `otp` — OTP & secure token generation
```js
generateOTP(6)         // → '084729'  (numeric, zero-padded)
generateOTP(4)         // → '0391'
generateSecureToken(32)// → '3a7b9c...' (64-char hex — for password reset)
generateUrlToken(24)   // → 'X4k-Bm...' (URL-safe base64 — for email links)
```
