// @ts-nocheck
'use strict';
/**
 * Sports — Sports content & betting Validators (Joi)
 */
let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  module.exports = {};
  return;
}

const createArticle = Joi.object({
  title:       Joi.string().min(5).max(300).required(),
  content:     Joi.string().min(10).required(),
  categoryId:  Joi.number().integer().positive().optional(),
  leagueId:    Joi.number().integer().positive().optional(),
  thumbnail:   Joi.string().uri().optional().allow(''),
  isPublished: Joi.boolean().optional(),
  tags:        Joi.array().items(Joi.string().max(50)).optional(),
});

const placeBet = Joi.object({
  matchId:   Joi.number().integer().positive().required(),
  betType:   Joi.string().max(50).required(),
  selection: Joi.string().max(100).required(),
  amount:    Joi.number().positive().min(10_000).max(100_000_000).required(),
  odds:      Joi.number().positive().min(1).required(),
});

const addFavourite = Joi.object({
  entityType: Joi.string().valid('team', 'league', 'match', 'player').required(),
  entityId:   Joi.number().integer().positive().required(),
});

const paginationQuery = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  limit:    Joi.number().integer().min(1).max(100).default(20),
  search:   Joi.string().max(200).optional().allow(''),
  status:   Joi.string().optional().allow(''),
  leagueId: Joi.number().integer().positive().optional(),
  teamId:   Joi.number().integer().positive().optional(),
  from:     Joi.string().isoDate().optional(),
  to:       Joi.string().isoDate().optional(),
});

module.exports = { createArticle, placeBet, addFavourite, paginationQuery };
