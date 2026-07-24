// @ts-nocheck
'use strict';
/**
 * Dating — Profile & Social Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const updateProfile = Joi.object({
  fullName:  Joi.string().min(2).max(80).optional(),
  bio:       Joi.string().max(500).optional().allow(''),
  city:      Joi.string().max(100).optional().allow(''),
  interests: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  height:    Joi.number().min(100).max(250).optional(),
  weight:    Joi.number().min(30).max(300).optional(),
  avatar:    Joi.string().uri().optional().allow(''),
  photos:    Joi.array().items(Joi.string().uri()).max(9).optional(),
}).min(1);

const createPost = Joi.object({
  content:  Joi.string().max(2000).optional().allow(''),
  images:   Joi.array().items(Joi.string().uri()).max(9).optional(),
  hashtags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  isPublic: Joi.boolean().optional(),
}).or('content', 'images');

const sendMessage = Joi.object({
  content:     Joi.string().max(2000).optional().allow(''),
  messageType: Joi.string().valid('text', 'image', 'voice', 'sticker', 'gift').default('text'),
  mediaUrl:    Joi.string().uri().optional().allow(''),
  giftId:      Joi.number().integer().positive().optional(),
});

module.exports = { updateProfile, createPost, sendMessage };
