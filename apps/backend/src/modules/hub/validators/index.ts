'use strict';
/**
 * Hub Module — Validators barrel export
 */
const authValidator    = require('./authValidator');
const contentValidator = require('./contentValidator');

module.exports = { authValidator, contentValidator };
