// @ts-nocheck
/**
 * Security Settings — shared constants & default values
 * (Admin dashboard is JSX, not TSX, so this is plain JS with JSDoc)
 */

/** @typedef {{
 *   max_login_attempts_ip: number,
 *   max_login_attempts_account: number,
 *   max_api_key_attempts: number,
 *   max_2fa_attempts: number,
 *   max_otp_attempts: number,
 *   max_invoice_attempts: number,
 *   max_forgot_password_attempts: number,
 *   max_api_whitelist_attempts: number,
 * }} BruteForce */

/** @typedef {{
 *   max_admin_wrong_url_attempts: number,
 *   admin_single_ip: boolean,
 *   admin_single_device: boolean,
 *   client_single_device: boolean,
 * }} AccessControl */

/** @typedef {{
 *   admin_panel_path: string,
 *   show_admin_login_button: boolean,
 *   max_accounts_per_ip: number,
 *   session_lifetime: number,
 *   cron_job_secret: string,
 *   require_strong_password: boolean,
 * }} OtherSecurity */

/** @typedef {{ id: string, label: string, enabled: boolean }} CaptchaModule */

/** @typedef {{
 *   status: boolean,
 *   type: 'recaptcha_v2'|'recaptcha_v3'|'hcaptcha'|'turnstile',
 *   site_key: string,
 *   secret_key: string,
 *   modules: CaptchaModule[],
 * }} Captcha */

/** @typedef {{
 *   brute_force: BruteForce,
 *   access_control: AccessControl,
 *   other: OtherSecurity,
 *   captcha: Captcha,
 * }} SecuritySettings */

export const CAPTCHA_MODULES = [
  { id: 'register',            label: 'Đăng ký' },
  { id: 'login',               label: 'Đăng nhập' },
  { id: 'forgot_password',     label: 'Quên mật khẩu' },
  { id: 'affiliate_withdraw',  label: 'Rút tiền Affiliate' },
  { id: 'deposit_invoice',     label: 'Tạo hóa đơn nạp tiền' },
  { id: 'support_ticket',      label: 'Tạo yêu cầu hỗ trợ' },
  { id: 'verify_2fa',          label: 'Xác minh 2FA' },
  { id: 'verify_otp',          label: 'Xác minh OTP' },
];

export const CAPTCHA_TYPES = [
  { value: 'recaptcha_v2', label: 'reCAPTCHA v2 (Google)' },
  { value: 'recaptcha_v3', label: 'reCAPTCHA v3 (Google)' },
  { value: 'hcaptcha',     label: 'hCaptcha' },
  { value: 'turnstile',    label: 'Cloudflare Turnstile' },
];

/** @type {SecuritySettings} */
export const DEFAULT_SETTINGS = {
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
    session_lifetime:                10_000_000,
    cron_job_secret:                 'd2fbd51284f35b5a',
    require_strong_password:         false,
  },
  captcha: {
    status:     false,
    type:       'recaptcha_v2',
    site_key:   '',
    secret_key: '',
    modules:    CAPTCHA_MODULES.map(m => ({ ...m, enabled: false })),
  },
};
