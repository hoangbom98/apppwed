'use strict';
/**
 * store/controllers/assetController.js
 * GET  /store/resources          → my digital assets
 * GET  /store/download/:assetId  → download file (increments counter)
 * GET  /store/api-keys           → list API keys
 * POST /store/api-keys           → create API key
 * GET  /store/subscriptions      → list subscriptions
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Joi    = require('joi');

exports.getMyResources = async (req, res) => {
  try {
    const assets = await req.prisma.storeAsset.findMany({
      where:   { userId: req.user.id },
      orderBy: { activatedAt: 'desc' },
    });
    return success(res, { data: assets });
  } catch (e) { return error(res, e.message, 500); }
};

exports.downloadAsset = async (req, res) => {
  try {
    const asset = await req.prisma.storeAsset.findFirst({
      where: { id: req.params.assetId, userId: req.user.id },
    });
    if (!asset) return notFound(res);
    if (asset.expiresAt && new Date(asset.expiresAt) < new Date()) return error(res, 'Tài nguyên đã hết hạn', 403);

    await req.prisma.storeAsset.update({ where: { id: asset.id }, data: { downloads: { increment: 1 } } });
    return success(res, { downloadUrl: asset.downloadUrl });
  } catch (e) { return error(res, e.message, 500); }
};

const apiKeySchema = Joi.object({
  name:      Joi.string().min(2).max(60).required(),
  productId: Joi.string().allow('').optional(),
});

exports.getAPIKeys = async (req, res) => {
  try {
    const keys = await req.prisma.storeApiKey.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, { data: keys });
  } catch (e) { return error(res, e.message, 500); }
};

exports.createAPIKey = async (req, res) => {
  const { error: valError, value } = apiKeySchema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const key = `lk_${crypto.randomBytes(24).toString('hex')}`;
    const apiKey = await req.prisma.storeApiKey.create({
      data: { id: uuidv4(), userId: req.user.id, name: value.name, productId: value.productId || null, key, createdAt: new Date() },
    });
    return success(res, apiKey, 'API key đã được tạo');
  } catch (e) { return error(res, e.message, 500); }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const subs = await req.prisma.storeSubscription.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, { data: subs });
  } catch (e) { return error(res, e.message, 500); }
};
