const i18next = require('../config/i18n');

module.exports = (req, res, next) => {
  // 1. Lấy ngôn ngữ từ header Accept-Language
  let lang = req.headers['accept-language']?.split(',')[0]?.trim() || 'vi';

  // 2. Nếu user đã đăng nhập và có preference language, ưu tiên hơn
  if (req.user && req.user.preferredLanguage) {
    lang = req.user.preferredLanguage;
  }

  // 3. Kiểm tra ngôn ngữ có được hỗ trợ không
  const supported = ['vi', 'en'];
  if (!supported.includes(lang)) {
    lang = 'vi';
  }

  // 4. Gán vào req và res.locals
  req.language = lang;
  res.locals.language = lang;

  // 5. Set lại ngôn ngữ cho i18next (để dùng trong controller)
  i18next.changeLanguage(lang);

  next();
};
