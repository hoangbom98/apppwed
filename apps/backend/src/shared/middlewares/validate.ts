'use strict';
/**
 * Validation middleware using Joi.
 * Falls back to simple rule engine if Joi is not installed.
 *
 * Usage:
 *   const { validate, schemas } = require('./validate');
 *   router.post('/register', validate(schemas.register), controller.register);
 */

let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

// ── Joi-based validator ───────────────────────────────────────────────────
function validateJoi(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(422).json({ success: false, message: messages[0], errors: messages });
    }
    req[source] = value; // replace with sanitised value
    next();
  };
}

// ── Fallback simple validator ─────────────────────────────────────────────
function validateSimple(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [source, fields] of Object.entries(schema)) {
      const src = req[source] || {};
      for (const [field, rules] of Object.entries(fields)) {
        const val = src[field];
        for (const rule of (Array.isArray(rules) ? rules : rules.split('|'))) {
          if (rule === 'required' && (val === undefined || val === null || val === ''))
            errors.push(`${field} is required`);
          else if (rule === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
            errors.push(`${field} must be a valid email`);
          else if (rule === 'phone' && val && !/^(0|\+84)[0-9]{8,10}$/.test(val))
            errors.push(`${field} must be a valid Vietnamese phone number`);
          else if (typeof rule === 'string' && rule.startsWith('min:') && val) {
            const n = +rule.split(':')[1];
            if (String(val).length < n) errors.push(`${field} must be at least ${n} characters`);
          } else if (typeof rule === 'string' && rule.startsWith('max:') && val) {
            const n = +rule.split(':')[1];
            if (String(val).length > n) errors.push(`${field} must be at most ${n} characters`);
          }
        }
      }
    }
    if (errors.length) return res.status(422).json({ success: false, message: errors[0], errors });
    next();
  };
}

// ── Joi Schemas ───────────────────────────────────────────────────────────
const schemas = Joi ? {
  // Auth
  sendOtp:    Joi.object({ phone: Joi.string().pattern(/^(0|\+84)[0-9]{8,10}$/).required() }),
  verifyOtp:  Joi.object({ phone: Joi.string().required(), otp: Joi.string().length(6).required() }),
  register:   Joi.object({
    phone:    Joi.string().pattern(/^(0|\+84)[0-9]{8,10}$/).required(),
    password: Joi.string().min(6).max(64).required(),
    full_name:Joi.string().min(2).max(80).required(),
    dob:      Joi.string().optional(),
    gender:   Joi.string().valid('male','female','other').optional(),
  }),
  login:      Joi.object({
    phone:    Joi.string().required(),
    password: Joi.string().required(),
  }),
  emailLogin: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Wallet / Finance
  deposit:    Joi.object({
    amount:         Joi.number().positive().min(10_000).max(500_000_000).required(),
    payment_method: Joi.string().valid('momo','zalopay','vnpay','bank','qr').required(),
  }),
  withdraw:   Joi.object({
    amount:         Joi.number().positive().min(50_000).max(100_000_000).required(),
    payment_method: Joi.string().valid('banking','usdt','momo').required(),
    address:        Joi.string().min(6).max(200).required(),
  }),
  sendGift:   Joi.object({
    gift_id:        Joi.number().integer().positive().required(),
    quantity:       Joi.number().integer().min(1).max(999).default(1),
  }),

  // Profile
  updateProfile: Joi.object({
    full_name:  Joi.string().min(2).max(80).optional(),
    bio:        Joi.string().max(500).optional().allow(''),
    city:       Joi.string().max(100).optional(),
    interests:  Joi.array().items(Joi.string()).optional(),
    height:     Joi.number().min(100).max(250).optional(),
    weight:     Joi.number().min(30).max(300).optional(),
  }),

  // Content
  createPost: Joi.object({
    content:  Joi.string().max(2000).optional().allow(''),
    images:   Joi.array().items(Joi.string().uri()).optional(),
    hashtags: Joi.array().items(Joi.string()).optional(),
  }),
} : {};

// ── Export ────────────────────────────────────────────────────────────────
const validate = Joi
  ? (schema, source = 'body') => validateJoi(schema, source)
  : validateSimple;

module.exports = { validate, schemas, validateJoi, validateSimple };
