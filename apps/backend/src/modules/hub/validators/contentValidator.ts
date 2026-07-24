// @ts-nocheck
'use strict';
/**
 * Hub — Content Validators (Joi)
 * Covers: games, websites, tools, news, pages, banners, menus, feedback
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const createGame = Joi.object({
  name:        Joi.string().min(2).max(200).required(),
  slug:        Joi.string().max(200).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  thumbnail:   Joi.string().uri().optional().allow(''),
  url:         Joi.string().uri().required(),
  categoryId:  Joi.number().integer().positive().required(),
  tags:        Joi.array().items(Joi.string()).optional(),
  isActive:    Joi.boolean().optional(),
});

const createNews = Joi.object({
  title:       Joi.string().min(5).max(300).required(),
  slug:        Joi.string().max(300).optional(),
  content:     Joi.string().min(10).required(),
  excerpt:     Joi.string().max(500).optional().allow(''),
  thumbnail:   Joi.string().uri().optional().allow(''),
  categoryId:  Joi.number().integer().positive().optional(),
  isPublished: Joi.boolean().optional(),
});

const submitFeedback = Joi.object({
  name:    Joi.string().min(2).max(100).required(),
  email:   Joi.string().email().required(),
  subject: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(2000).required(),
});

const paginationQuery = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(200).optional().allow(''),
  status: Joi.string().valid('active', 'inactive', 'draft', 'published').optional(),
  sort:   Joi.string().valid('createdAt', 'updatedAt', 'name', 'title').optional(),
  order:  Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createGame, createNews, submitFeedback, paginationQuery };
