// @ts-nocheck
'use strict';
/**
 * Game — Wallet/Transaction Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const createDeposit = Joi.object({
  amount:         Joi.number().positive().min(10_000).max(500_000_000).required(),
  payment_method: Joi.string().valid('momo', 'zalopay', 'vnpay', 'bank', 'qr').required(),
  bank_account:   Joi.string().max(100).optional().allow(''),
  note:           Joi.string().max(500).optional().allow(''),
});

const createWithdraw = Joi.object({
  amount:         Joi.number().positive().min(50_000).max(100_000_000).required(),
  payment_method: Joi.string().valid('banking', 'usdt', 'momo').required(),
  address:        Joi.string().min(6).max(200).required(),
  note:           Joi.string().max(500).optional().allow(''),
});

const placeLotteryBet = Joi.object({
  drawId:     Joi.number().integer().positive().required(),
  betNumbers: Joi.array().items(Joi.string()).min(1).required(),
  betType:    Joi.string().max(50).required(),
  amount:     Joi.number().positive().min(1_000).required(),
});

module.exports = { createDeposit, createWithdraw, placeLotteryBet };
