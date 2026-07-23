'use strict';
/**
 * @lkvip/utils — Entry point
 * Barrel re-export for all shared backend utility modules.
 *
 * Usage:
 *   const { slugify, formatVND, isEmail, addDays, parsePaginationQuery, generateOTP, formatCompact, pick, groupBy } = require('@lkvip/utils');
 */

const slugify     = require('./slugify');
const strings     = require('./strings');
const dates       = require('./dates');
const validators  = require('./validators');
const numbers     = require('./numbers');
const pagination  = require('./pagination');
const otp         = require('./otp');
const format      = require('./format');
const object      = require('./object');

module.exports = {
  ...slugify,
  ...strings,
  ...dates,
  ...validators,
  ...numbers,
  ...pagination,
  ...otp,
  ...format,
  ...object,
};
