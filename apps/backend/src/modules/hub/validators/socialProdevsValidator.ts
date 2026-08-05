// @ts-nocheck
'use strict';
/**
 * Hub — Social App & ProDevs Validators (Joi)
 *
 * Validators được tích hợp từ:
 *   • apps/external/social  → Social post moderation + report workflow
 *   • apps/external/prodevs → Project scaffold + template CRUD + AI config
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  // eslint-disable-next-line no-useless-return
  return;
}

// ── Danh sách hợp lệ (sync với features.ts của ProDevs CLI) ──────────────────
const FRAMEWORKS      = ['nextjs', 'express', 'nestjs', 'none'];
const DATABASES       = ['postgresql', 'mysql', 'none'];
const AUTHENTICATIONS = ['better-auth', 'authjs', 'clerk', 'none'];
const STYLINGS        = ['tailwind', 'none'];
const STORAGES        = ['cloudinary', 'aws-s3', 'none'];
const PAYMENTS        = ['stripe', 'flutterwave', 'paystack', 'none'];
const AI_PROVIDERS    = [
  'openai', 'gemini', 'claude', 'groq', 'deepseek', 'together',
  'perplexity', 'fireworks', 'mistral', 'cohere', 'huggingface',
  'replicate', 'xai', 'none',
];

// ── Shared stack fields (dùng cho cả project và template) ────────────────────
const stackFields = {
  framework:      Joi.string().valid(...FRAMEWORKS).default('none').optional(),
  database:       Joi.string().valid(...DATABASES).default('none').optional(),
  authentication: Joi.string().valid(...AUTHENTICATIONS).default('none').optional(),
  styling:        Joi.string().valid(...STYLINGS).default('none').optional(),
  storage:        Joi.string().valid(...STORAGES).default('none').optional(),
  payments:       Joi.string().valid(...PAYMENTS).default('none').optional(),
  aiProvider:     Joi.string().valid(...AI_PROVIDERS).default('none').optional(),
};

// ════════════════════════════════════════════════════════════════════════════
// SOCIAL APP validators
// ════════════════════════════════════════════════════════════════════════════

/** PATCH /hub/admin/social-posts/:id */
const updateSocialPost = Joi.object({
  status: Joi.string().valid('active', 'hidden', 'removed', 'pending').required(),
});

/** PATCH /hub/admin/social-reports/:id */
const updateSocialReport = Joi.object({
  status:    Joi.string().valid('pending', 'reviewed', 'resolved', 'dismissed').required(),
  adminNote: Joi.string().max(2000).optional().allow('', null),
});

// ════════════════════════════════════════════════════════════════════════════
// PRODEVS CLI validators
// ════════════════════════════════════════════════════════════════════════════

/** POST /hub/admin/prodevs/projects */
const createProdevsProject = Joi.object({
  name:        Joi.string().min(1).max(150).pattern(/^[a-zA-Z0-9_\-. ]+$/).required()
    .messages({ 'string.pattern.base': 'Tên chỉ được chứa chữ, số, dấu gạch ngang và dấu chấm' }),
  description: Joi.string().max(2000).optional().allow('', null),
  setupMode:   Joi.string().valid('manual', 'ai').default('manual').optional(),
  packages:    Joi.array().items(Joi.string()).optional(),
  ...stackFields,
});

/** PUT /hub/admin/prodevs/projects/:id */
const updateProdevsProject = Joi.object({
  name:        Joi.string().min(1).max(150).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  setupMode:   Joi.string().valid('manual', 'ai').optional(),
  packages:    Joi.array().items(Joi.string()).optional(),
  ...stackFields,
}).min(1);

/** POST /hub/admin/prodevs/templates */
const createProdevsTemplate = Joi.object({
  name:        Joi.string().min(1).max(150).required(),
  description: Joi.string().max(2000).optional().allow('', null),
  isActive:    Joi.boolean().default(true).optional(),
  sortOrder:   Joi.number().integer().min(0).default(0).optional(),
  ...stackFields,
});

/** PUT /hub/admin/prodevs/templates/:id */
const updateProdevsTemplate = Joi.object({
  name:        Joi.string().min(1).max(150).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  isActive:    Joi.boolean().optional(),
  sortOrder:   Joi.number().integer().min(0).optional(),
  ...stackFields,
}).min(1);

/** PUT /hub/admin/prodevs/ai-config
 *  Body: { defaultProvider?, OPENAI_API_KEY?, GEMINI_API_KEY?, ... }
 *  Mỗi key field là optional — chỉ update các field được gửi lên.
 */
const updateProdevsAIConfig = Joi.object({
  defaultProvider:   Joi.string().valid(...AI_PROVIDERS.filter(p => p !== 'none')).optional(),
  OPENAI_API_KEY:    Joi.string().max(200).optional().allow('', null),
  GEMINI_API_KEY:    Joi.string().max(200).optional().allow('', null),
  ANTHROPIC_API_KEY: Joi.string().max(200).optional().allow('', null),
  GROQ_API_KEY:      Joi.string().max(200).optional().allow('', null),
  DEEPSEEK_API_KEY:  Joi.string().max(200).optional().allow('', null),
  TOGETHER_API_KEY:  Joi.string().max(200).optional().allow('', null),
  PERPLEXITY_API_KEY:Joi.string().max(200).optional().allow('', null),
  FIREWORKS_API_KEY: Joi.string().max(200).optional().allow('', null),
  MISTRAL_API_KEY:   Joi.string().max(200).optional().allow('', null),
  COHERE_API_KEY:    Joi.string().max(200).optional().allow('', null),
  HUGGINGFACE_API_KEY:Joi.string().max(200).optional().allow('', null),
  REPLICATE_API_TOKEN:Joi.string().max(200).optional().allow('', null),
  XAI_API_KEY:       Joi.string().max(200).optional().allow('', null),
}).min(1);

module.exports = {
  // Social
  updateSocialPost,
  updateSocialReport,
  // ProDevs
  createProdevsProject,
  updateProdevsProject,
  createProdevsTemplate,
  updateProdevsTemplate,
  updateProdevsAIConfig,
};
