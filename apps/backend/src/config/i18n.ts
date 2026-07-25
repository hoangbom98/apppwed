const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

// Supported locales — add new language by:
//   1. Creating apps/backend/locales/<lng>/common.json
//   2. Adding the language code to SUPPORTED_LOCALES below
const SUPPORTED_LOCALES = ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'id'];

i18next
  .use(Backend)
  .init({
    fallbackLng: 'vi',
    preload: SUPPORTED_LOCALES,
    ns: ['common', 'user', 'game', 'dating', 'validation'],
    defaultNS: 'common',
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });

module.exports = i18next;
