'use strict';
/**
 * Hub Module
 *
 * Provides the public hub portal functionality:
 * - Auth (register, login, profile)
 * - CMS (games, websites, tools, news, pages, banners, menus)
 * - Admin CRUD endpoints for all hub resources
 * - SEO metadata
 * - Downloads & Events
 * - News comments
 */
const router = require('./routes/index');

module.exports = { router };
