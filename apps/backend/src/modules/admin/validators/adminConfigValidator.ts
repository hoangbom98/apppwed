// @ts-nocheck
'use strict';
/**
 * Admin — Config/Settings Validators (Joi)
 * Covers: site settings, UI config, announcements, game config
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const updateSetting = Joi.object({
  value: Joi.any().required(),
  note:  Joi.string().max(500).optional().allow(''),
});

const bulkUpsertSettings = Joi.object({
  settings: Joi.array().items(
    Joi.object({
      key:         Joi.string().max(150).required(),
      value:       Joi.any().required(),
      group:       Joi.string().max(60).optional(),
      description: Joi.string().max(500).optional().allow('', null),
    })
  ).min(1).max(200).required(),
});

const testIntegration = Joi.object({
  key:    Joi.string().max(150).required(),
  value:  Joi.string().allow('').required(),
  chatId: Joi.string().optional().allow('', null),
});

const createAnnouncement = Joi.object({
  title:     Joi.string().min(5).max(300).required(),
  content:   Joi.string().min(10).required(),
  type:      Joi.string().valid('info', 'warning', 'success', 'error').default('info'),
  isActive:  Joi.boolean().optional(),
  expiresAt: Joi.string().isoDate().optional().allow(null),
  projectId: Joi.string().valid('hub', 'game', 'trade', 'dating', 'sports', 'all').default('all'),
});

const updateGameConfig = Joi.object({
  isActive:    Joi.boolean().optional(),
  minBet:      Joi.number().positive().optional(),
  maxBet:      Joi.number().positive().optional(),
  commission:  Joi.number().min(0).max(1).optional(),
  metadata:    Joi.object().optional(),
}).min(1);

const batchUpdateUsers = Joi.object({
  userIds: Joi.array().items(Joi.number().integer().positive()).min(1).max(100).required(),
  action:  Joi.string().valid('activate', 'deactivate', 'ban', 'unban', 'verify').required(),
  reason:  Joi.string().max(500).optional().allow(''),
});

module.exports = { updateSetting, createAnnouncement, updateGameConfig, batchUpdateUsers, bulkUpsertSettings, testIntegration };
