'use strict';
/**
 * Swagger / OpenAPI 3.0 documentation setup.
 * Visit /api/docs to view the interactive API explorer.
 */
const path = require('path');

let swaggerUi, swaggerJsdoc;
try {
  swaggerUi    = require('swagger-ui-express');
  swaggerJsdoc = require('swagger-jsdoc');
} catch { swaggerUi = null; swaggerJsdoc = null; }

const definition = {
  openapi: '3.0.0',
  info: {
    title:       'Multi-Project API',
    version:     '2.0.0',
    description: 'Hub | Game | Trade | Dating | Sports | Admin — all on port 5000',
    contact:     { name: 'Dev Team', email: 'dev@example.com' },
  },
  servers: [
    { url: '/api', description: 'Current server' },
    { url: 'https://api.example.com/api', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' }, page: { type: 'integer' },
          limit: { type: 'integer' }, pages: { type: 'integer' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Hub/Auth',    description: 'Hub authentication' },
    { name: 'Hub/CMS',     description: 'Hub content (games, news, tools, websites)' },
    { name: 'Game/Auth',   description: 'Game authentication' },
    { name: 'Game/Wallet', description: 'Deposits, withdrawals, history' },
    { name: 'Game/Games',  description: 'Game catalogue and sessions' },
    { name: 'Dating/Auth', description: 'Dating authentication & onboarding' },
    { name: 'Dating/Match',description: 'Swipe, like, match' },
    { name: 'Dating/Chat', description: 'Messaging' },
    { name: 'Dating/Live', description: 'Livestreaming' },
    { name: 'Dating/Feed', description: 'Posts, stories, short videos' },
    { name: 'Admin',       description: 'Super-admin cross-project management' },
  ],
};

const options = swaggerJsdoc ? {
  definition,
  apis: [
    path.join(__dirname, '../../modules/*/routes/*.js'),
    path.join(__dirname, '../../modules/*/controllers/*.js'),
    path.join(__dirname, '../routes/*.js'),
  ],
} : null;

let swaggerSpec = null;
if (swaggerJsdoc && options) {
  try { swaggerSpec = swaggerJsdoc(options); } catch { swaggerSpec = null; }
}

/**
 * Mount Swagger UI on the Express app.
 * @param {import('express').Application} app
 */
function mount(app) {
  if (!swaggerUi || !swaggerSpec) {
    app.get('/api/docs', (_req, res) => res.send('<h2>Swagger not available — run: npm install swagger-ui-express swagger-jsdoc</h2>'));
    app.get('/api/docs.json', (_req, res) => res.json({ info: { title: 'API', version: '2.0.0' }, paths: {} }));
    return;
  }

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Multi-Project API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

module.exports = { mount, definition };
