// @ts-nocheck
'use strict';
/**
 * Trade — Order/Market Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const createOrder = Joi.object({
  symbol:    Joi.string().max(20).uppercase().required(),
  side:      Joi.string().valid('buy', 'sell').required(),
  type:      Joi.string().valid('market', 'limit', 'stop_limit').required(),
  quantity:  Joi.number().positive().required(),
  price:     Joi.when('type', {
    is: Joi.string().valid('limit', 'stop_limit'),
    then: Joi.number().positive().required(),
    otherwise: Joi.optional(),
  }),
  stopPrice: Joi.when('type', {
    is: 'stop_limit',
    then: Joi.number().positive().required(),
    otherwise: Joi.optional(),
  }),
});

const depositWallet = Joi.object({
  amount:         Joi.number().positive().min(100_000).max(1_000_000_000).required(),
  payment_method: Joi.string().valid('bank', 'momo', 'zalopay').required(),
  note:           Joi.string().max(500).optional().allow(''),
});

const withdrawWallet = Joi.object({
  amount:      Joi.number().positive().min(100_000).max(1_000_000_000).required(),
  bank_code:   Joi.string().max(20).required(),
  bank_account:Joi.string().min(6).max(30).required(),
  bank_name:   Joi.string().max(100).required(),
  account_name:Joi.string().max(100).required(),
  note:        Joi.string().max(500).optional().allow(''),
});

module.exports = { createOrder, depositWallet, withdrawWallet };
