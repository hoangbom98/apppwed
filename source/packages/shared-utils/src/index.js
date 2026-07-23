'use strict';
/**
 * @kjc/utils — Entry point
 * Barrel re-export for all shared backend utility modules.
 *
 * Usage:
 *   const { slugify, formatVND, isEmail, addDays } = require('@kjc/utils');
 */

const slugify   = require('./slugify');
const strings   = require('./strings');
const dates     = require('./dates');
const validators = require('./validators');
const numbers   = require('./numbers');

module.exports = {
  ...slugify,
  ...strings,
  ...dates,
  ...validators,
  ...numbers,
};
