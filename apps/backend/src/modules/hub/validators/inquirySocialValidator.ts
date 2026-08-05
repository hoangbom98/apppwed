// @ts-nocheck
'use strict';
/**
 * Hub — Inquiry & SocialChannel Validators (Joi)
 * Covers: public inquiry submit, admin social channel CRUD, admin inquiry status update.
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  // eslint-disable-next-line no-useless-return
  return;
}

/** POST /hub/inquiry — public visitor contact form */
const submitInquiry = Joi.object({
  name:          Joi.string().min(2).max(150).required(),
  email:         Joi.string().email().max(254).required(),
  phone:         Joi.string().max(30).optional().allow('', null),
  message:       Joi.string().min(5).max(5000).required(),
  budget:        Joi.string().max(100).optional().allow('', null),
  resourceType:  Joi.string().valid('news', 'tool', 'game', 'event').optional().allow(null),
  resourceId:    Joi.string().max(36).optional().allow('', null),
  resourceTitle: Joi.string().max(255).optional().allow('', null),
});

/** PATCH /hub/admin/inquiries/:id/status */
const updateInquiryStatus = Joi.object({
  status:    Joi.string().valid('new', 'in_progress', 'resolved', 'archived').required(),
  adminNote: Joi.string().max(2000).optional().allow('', null),
});

/** POST /hub/admin/social-channels */
const createSocialChannel = Joi.object({
  name:     Joi.string().min(1).max(100).required(),
  url:      Joi.string().uri().max(500).required(),
  icon:     Joi.string().max(50).default('link').optional(),
  isActive: Joi.boolean().default(true).optional(),
  order:    Joi.number().integer().min(0).default(0).optional(),
});

/** PATCH /hub/admin/social-channels/:id — all fields optional */
const updateSocialChannel = Joi.object({
  name:     Joi.string().min(1).max(100).optional(),
  url:      Joi.string().uri().max(500).optional(),
  icon:     Joi.string().max(50).optional(),
  isActive: Joi.boolean().optional(),
  order:    Joi.number().integer().min(0).optional(),
}).min(1); // at least one field must be provided

module.exports = { submitInquiry, updateInquiryStatus, createSocialChannel, updateSocialChannel };
