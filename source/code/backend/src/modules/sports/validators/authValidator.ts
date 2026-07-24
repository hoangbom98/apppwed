// @ts-nocheck
'use strict';
/**
 * Sports — Auth Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const register = Joi.object({
  email:    Joi.string().email().max(100).required(),
  password: Joi.string().min(8).max(64).required(),
  fullName: Joi.string().min(2).max(80).required(),
  phone:    Joi.string().pattern(/^(0|\+84)[0-9]{8,10}$/).optional().allow(''),
});

const login = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).max(64).required(),
});

module.exports = { register, login, changePassword };
