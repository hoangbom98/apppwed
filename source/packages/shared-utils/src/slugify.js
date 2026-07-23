'use strict';
/**
 * @kjc/utils — slugify.js
 * Convert a string to a URL-safe slug.
 *
 * @example
 *   slugify('Thể thao Bóng Đá')  // → 'the-thao-bong-da'
 *   slugify('Hello World 123')   // → 'hello-world-123'
 */

/** Vietnamese character map */
const VI_MAP = {
  à:'a',á:'a',â:'a',ã:'a',å:'a',ä:'a',
  è:'e',é:'e',ê:'e',ë:'e',
  ì:'i',í:'i',î:'i',ï:'i',
  ò:'o',ó:'o',ô:'o',õ:'o',ö:'o',
  ù:'u',ú:'u',û:'u',ü:'u',
  ý:'y',ÿ:'y',
  ñ:'n',
  // Vietnamese specific
  ắ:'a',ặ:'a',ầ:'a',ấ:'a',ẩ:'a',ẫ:'a',ậ:'a',ả:'a',ã:'a',ạ:'a',
  ằ:'a',ắ:'a',ẳ:'a',ẵ:'a',ặ:'a',
  ắ:'a',ặ:'a',ắ:'a',
  đ:'d',
  ề:'e',ế:'e',ể:'e',ễ:'e',ệ:'e',ẹ:'e',ẻ:'e',ẽ:'e',
  ổ:'o',ỗ:'o',ộ:'o',ợ:'o',ớ:'o',ờ:'o',ở:'o',ỡ:'o',ộ:'o',ọ:'o',ỏ:'o',
  ứ:'u',ừ:'u',ử:'u',ữ:'u',ự:'u',ụ:'u',ủ:'u',ũ:'u',
  ỳ:'y',ỷ:'y',ỹ:'y',ỵ:'y',ị:'i',ỉ:'i',ĩ:'i',
};

/**
 * Slugify a string (supports Vietnamese diacritics).
 * @param {string} str
 * @param {object} [opts]
 * @param {string} [opts.separator='-']   Separator character between words
 * @param {boolean} [opts.lower=true]     Lowercase the result
 * @returns {string}
 */
function slugify(str, opts = {}) {
  const { separator = '-', lower = true } = opts;
  if (typeof str !== 'string') return '';

  let result = str;

  // Replace Vietnamese chars
  result = result
    .split('')
    .map(c => VI_MAP[c] || c)
    .join('');

  // Normalize and remove remaining diacritics
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (lower) result = result.toLowerCase();

  // Replace non-word characters with separator
  result = result
    .replace(/[^\w\s-]/g, '')      // remove non-word chars (keep hyphens)
    .replace(/[\s_]+/g, separator) // spaces/underscores → separator
    .replace(/-+/g, separator)     // collapse multiple separators
    .replace(/^[-]+|[-]+$/g, '');  // trim leading/trailing separators

  return result;
}

module.exports = { slugify };
