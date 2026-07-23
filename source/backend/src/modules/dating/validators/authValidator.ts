// @ts-nocheck
'use strict';
/**
 * Dating — Auth Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const register = Joi.object({
  phone:    Joi.string().pattern(/^(0|\+84)[0-9]{8,10}$/).required(),
  password: Joi.string().min(8).max(64).required(),
  fullName: Joi.string().min(2).max(80).required(),
  gender:   Joi.string().valid('male', 'female', 'other').required(),
  dob:      Joi.string().isoDate().optional(),
  referralCode: Joi.string().max(50).optional().allow(''),
});

const login = Joi.object({
  phone:    Joi.string().required(),
  password: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).max(64).required(),
});

module.exports = { register, login, changePassword };
