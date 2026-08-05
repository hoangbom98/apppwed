'use strict';
/**
 * Hub Module — Validators barrel export
 */
const authValidator           = require('./authValidator');
const contentValidator        = require('./contentValidator');
const inquirySocialValidator  = require('./inquirySocialValidator');
const socialProdevsValidator  = require('./socialProdevsValidator');

module.exports = {
  authValidator,
  contentValidator,
  inquirySocialValidator,
  socialProdevsValidator,
};
