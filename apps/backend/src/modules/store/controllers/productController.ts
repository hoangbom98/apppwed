'use strict';
/**
 * store/controllers/productController.js
 * GET  /store/products           → list with pagination/filter
 * GET  /store/products/:slug     → product detail
 */
const Joi = require('joi');
const { success, error, notFound } = require('../../../shared/utils/network/response');

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 24, type, category, q } = req.query;
    const where = {
      status: 'published',
      ...(type     ? { type }     : {}),
      ...(category ? { category } : {}),
      ...(q        ? { OR: [{ name: { contains: q } }, { shortDescription: { contains: q } }] } : {}),
    };

    const [items, total] = await Promise.all([
      req.prisma.storeProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        select: {
          id: true, name: true, slug: true, shortDescription: true,
          type: true, category: true, images: true,
          price: true, version: true, status: true, createdAt: true,
          seller: { select: { id: true, fullName: true } },
          _count: { select: { reviews: true } },
        },
      }),
      req.prisma.storeProduct.count({ where }),
    ]);

    return success(res, { data: items, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await req.prisma.storeProduct.findUnique({
      where:   { slug: req.params.slug },
      include: {
        reviews: {
          select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        seller: { select: { id: true, fullName: true } },
      },
    });
    if (!product || product.status !== 'published') return notFound(res);
    return success(res, product);
  } catch (e) { return error(res, e.message, 500); }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return success(res, { data: [], total: 0 });
    const where = { status: 'published', OR: [{ name: { contains: q } }, { shortDescription: { contains: q } }, { description: { contains: q } }] };
    const [items, total] = await Promise.all([
      req.prisma.storeProduct.findMany({ where, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
      req.prisma.storeProduct.count({ where }),
    ]);
    return success(res, { data: items, total });
  } catch (e) { return error(res, e.message, 500); }
};
