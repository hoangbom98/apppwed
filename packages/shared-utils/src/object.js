'use strict';
/**
 * @lkvip/utils — src/object.js
 *
 * Utility helpers for working with objects and arrays.
 */

/**
 * Pick specific keys from an object.
 * @template T
 * @param {T} obj
 * @param {(keyof T)[]} keys
 * @returns {Partial<T>}
 */
function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k];
    return acc;
  }, {});
}

/**
 * Omit specific keys from an object.
 * @template T
 * @param {T} obj
 * @param {(keyof T)[]} keys
 * @returns {Partial<T>}
 */
function omit(obj, keys) {
  const set = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !set.has(k)));
}

/**
 * Remove all keys with null or undefined values.
 * @param {object} obj
 * @returns {object}
 */
function removeNullish(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

/**
 * Deep-freeze an object to prevent accidental mutation (useful for config).
 * @template T
 * @param {T} obj
 * @returns {Readonly<T>}
 */
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = obj[name];
    if (val && typeof val === 'object') deepFreeze(val);
  });
  return Object.freeze(obj);
}

/**
 * Recursively merge two plain objects (right wins on conflict).
 * Arrays are replaced, not merged.
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] ?? {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Group an array of objects by a key.
 * @template T
 * @param {T[]} arr
 * @param {keyof T} key
 * @returns {Record<string, T[]>}
 */
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

module.exports = { pick, omit, removeNullish, deepFreeze, deepMerge, groupBy };
