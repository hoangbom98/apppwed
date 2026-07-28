'use strict';
/**
 * parseNestedFields middleware
 *
 * Khi client gửi file upload qua multipart/form-data, các field JSON nested
 * phải được encode theo dạng dot-notation:
 *   "personal.first_name"  →  { personal: { first_name: "..." } }
 *   "address.city"         →  { address: { city: "..." } }
 *   "a.b.c"                →  { a: { b: { c: "..." } } }
 *
 * Đặt middleware này SAU multer và TRƯỚC validate trong route:
 *   router.patch('/profile',
 *     upload.single('avatar'),
 *     parseNestedFields,
 *     validate(schema),
 *     controller.update
 *   );
 *
 * Ported from: crypto-exchange-main/backend/src/middlewares/parseNestedFields.ts
 * Enhanced: hỗ trợ đệ quy sâu tuỳ ý (không giới hạn 2 level).
 */

import { Request, Response, NextFunction } from 'express';

function parseNestedFields(req: Request, _res: Response, next: NextFunction): void {
  // Only run when body exists (multer + express.urlencoded đã parse xong)
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(req.body)) {
    const keys = key.split('.');

    if (keys.length === 1) {
      // No nesting — keep as-is
      data[key] = value;
      continue;
    }

    // Walk the dot path and build nested objects
    let current = data;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) {
        // Leaf node — assign the value
        current[k] = value;
      } else {
        // Intermediate node — ensure it is an object
        if (!current[k] || typeof current[k] !== 'object' || Array.isArray(current[k])) {
          current[k] = {};
        }
        current = current[k] as Record<string, unknown>;
      }
    }
  }

  req.body = data;
  next();
}

export default parseNestedFields;
