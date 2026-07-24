// @ts-nocheck
'use strict';
/**
 * Game — Auth Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const register = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email:    Joi.string().email().max(100).optional().allow(''),
  phone:    Joi.string().pattern(/^(0|\+84)[0-9]{8,10}$/).optional(),
  password: Joi.string().min(8).max(64).required(),
  fullName: Joi.string().min(2).max(80).optional().allow(''),
  referralCode: Joi.string().max(50).optional().allow(''),
}).or('email', 'phone');

const login = Joi.object({
  username: Joi.string().optional(),
  email:    Joi.string().email().optional(),
  phone:    Joi.string().optional(),
  password: Joi.string().required(),
}).or('username', 'email', 'phone');

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).max(64).required(),
});

const updateProfile = Joi.object({
  fullName: Joi.string().min(2).max(80).optional(),
  avatar:   Joi.string().uri().optional().allow(''),
  phone:    Joi.string().pattern(/^(0|\+84)[0-9]{8,10}$/).optional().allow(''),
}).min(1);

module.exports = { register, login, changePassword, updateProfile };
