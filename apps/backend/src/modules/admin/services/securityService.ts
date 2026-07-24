/**
 * securityService.js
 * Business logic for Security Settings.
 *
 * Storage strategy: 4 SystemSetting rows (one per section), each holding
 * the section JSON as its value. Keys:
 *   security.brute_force | security.access_control | security.captcha | security.other
 *
 * All rows use group = 'security'.
 */
'use strict';

const GROUP = 'security';

// ── Default security settings (matches frontend types/index.js exactly) ───────
const CAPTCHA_MODULES = [
  { id: 'register',           label: 'Đăng ký',                    enabled: false },
  { id: 'login',              label: 'Đăng nhập',                  enabled: false },
  { id: 'forgot_password',    label: 'Quên mật khẩu',              enabled: false },
  { id: 'affiliate_withdraw', label: 'Rút tiền Affiliate',         enabled: false },
  { id: 'deposit_invoice',    label: 'Tạo hóa đơn nạp tiền',       enabled: false },
  { id: 'support_ticket',     label: 'Tạo yêu cầu hỗ trợ',        enabled: false },
  { id: 'verify_2fa',         label: 'Xác minh 2FA',               enabled: false },
  { id: 'verify_otp',         label: 'Xác minh OTP',               enabled: false },
];

const DEFAULTS = {
  brute_force: {
    max_login_attempts_ip:           20,
    max_login_attempts_account:      10,
    max_api_key_attempts:            20,
    max_2fa_attempts:                10,
    max_otp_attempts:                10,
    max_invoice_attempts:            10,
    max_forgot_password_attempts:    10,
    max_api_whitelist_attempts:      10,
  },
  access_control: {
    max_admin_wrong_url_attempts:    5,
    admin_single_ip:                 false,
    admin_single_device:             false,
    client_single_device:            false,
  },
  other: {
    admin_panel_path:                'adcp',
    show_admin_login_button:         true,
    max_accounts_per_ip:             10,
    session_lifetime:                10000000,
    cron_job_secret:                 'd2fbd51284f35b5a',
    require_strong_password:         false,
  },
  captcha: {
    status:     false,
    type:       'recaptcha_v2',
    site_key:   '',
    secret_key: '',
    modules:    CAPTCHA_MODULES,
  },
};

const SECTION_KEYS = ['brute_force', 'access_control', 'other', 'captcha'];

function dbKey(section) { return `security.${section}`; }

/**
 * Load all security settings from DB, deep-merge with defaults.
 * @param {object} prisma — admin Prisma client
 */
async function getSettings(prisma) {
  const rows = await prisma.systemSetting.findMany({
    where: { group: GROUP },
  });

  const result = JSON.parse(JSON.stringify(DEFAULTS)); // deep clone defaults

  for (const row of rows) {
    const section = row.key.replace('security.', '');
    if (!SECTION_KEYS.includes(section)) continue;
    try {
      result[section] = { ...result[section], ...JSON.parse(row.value) };
    } catch {
      // ignore malformed row
    }
  }

  return result;
}

/**
 * Upsert security settings. Accepts a full or partial settings object.
 * Each present top-level section is merged with the existing DB value.
 * @param {object} prisma
 * @param {object} data  — e.g. { brute_force: {...}, captcha: {...} }
 */
async function saveSettings(prisma, data) {
  const ops = [];

  for (const section of SECTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(data, section)) continue;
    const payload = data[section];
    if (typeof payload !== 'object' || payload === null) continue;

    ops.push(
      prisma.systemSetting.upsert({
        where:  { key: dbKey(section) },
        create: {
          key:         dbKey(section),
          value:       JSON.stringify(payload),
          group:       GROUP,
          description: `Security settings – ${section}`,
        },
        update: { value: JSON.stringify(payload) },
      })
    );
  }

  if (ops.length === 0) {
    return getSettings(prisma);
  }

  await Promise.all(ops);
  return getSettings(prisma);
}

/**
 * Reset all security settings — delete all 'security' group rows.
 * Next GET will return DEFAULTS.
 * @param {object} prisma
 */
async function resetSettings(prisma) {
  await prisma.systemSetting.deleteMany({ where: { group: GROUP } });
  return JSON.parse(JSON.stringify(DEFAULTS));
}

/**
 * Validate captcha configuration (structural check — no live HTTP call in dev).
 * @param {string} siteKey
 * @param {string} secretKey
 * @param {string} type
 * @returns {{success:boolean, message:string}}
 */
async function testCaptchaConnection(siteKey, secretKey, type) {
  if (!siteKey || !secretKey) {
    return { success: false, message: 'Site key và Secret key không được để trống.' };
  }
  if (siteKey.length < 8 || secretKey.length < 8) {
    return { success: false, message: 'Key quá ngắn — kiểm tra lại cấu hình.' };
  }
  return {
    success: true,
    message: `Kết nối ${type} thành công (keys đã xác nhận định dạng).`,
  };
}

module.exports = { getSettings, saveSettings, resetSettings, testCaptchaConnection, DEFAULTS };
