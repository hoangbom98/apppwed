const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

// Supported locales — add new language by:
//   1. Creating apps/backend/locales/<lng>/common.json
//   2. Adding the language code to SUPPORTED_LOCALES below
const SUPPORTED_LOCALES = ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'id'];

// Use createInstance() to avoid polluting the global singleton and to be
// compatible with i18next-http-middleware v3.x regardless of the hoisted
// i18next version in the monorepo root node_modules.
const instance = i18next.createInstance();

instance
  .use(Backend)
  .init({
    fallbackLng: 'vi',
    preload: SUPPORTED_LOCALES,
    // Only load namespaces that actually exist on disk
    ns: ['common'],
    defaultNS: 'common',
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });

module.exports = instance;
