// @ts-nocheck
'use strict';
/**
 * Admin — Auth Validators (Joi)
 * Admin login uses email + password only. No public registration.
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const login = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).max(64).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

const createAdminUser = Joi.object({
  email:    Joi.string().email().max(100).required(),
  password: Joi.string().min(8).max(64).required(),
  fullName: Joi.string().min(2).max(80).required(),
  role:     Joi.string().valid('admin', 'super_admin', 'moderator', 'support').required(),
});

const updateAdminUser = Joi.object({
  email:    Joi.string().email().max(100).optional(),
  fullName: Joi.string().min(2).max(80).optional(),
  role:     Joi.string().valid('admin', 'super_admin', 'moderator', 'support').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { login, changePassword, createAdminUser, updateAdminUser };
