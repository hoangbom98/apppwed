/**
 * @lkvip/utils — object.ts
 * Utility helpers for working with objects and arrays.
 */

/**
 * Pick specific keys from an object.
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k];
    return acc;
  }, {} as Pick<T, K>);
}

/**
 * Omit specific keys from an object.
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const set = new Set<string>(keys as string[]);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !set.has(k)),
  ) as Omit<T, K>;
}

/**
 * Remove all keys with null or undefined values.
 */
export function removeNullish<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null),
  ) as Partial<T>;
}

/**
 * Deep-freeze an object to prevent accidental mutation (useful for config).
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = (obj as Record<string, unknown>)[name];
    if (val && typeof val === 'object') deepFreeze(val as object);
  });
  return Object.freeze(obj);
}

/**
 * Recursively merge two plain objects (right wins on conflict).
 * Arrays are replaced, not merged.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sv = source[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      result[key] = deepMerge(
        (result[key] ?? {}) as Record<string, unknown>,
        sv as Record<string, unknown>,
      ) as T[typeof key];
    } else {
      result[key] = sv as T[typeof key];
    }
  }
  return result;
}

/**
 * Group an array of objects by a key.
 */
export function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T,
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}
