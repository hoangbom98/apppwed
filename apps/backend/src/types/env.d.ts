/**
 * code/backend/src/types/env.d.ts
 *
 * TypeScript ambient declarations for Node.js `process.env` in the LKVIP GROUP Backend.
 * Provides strong typing for all environment variables defined in .env.example.
 *
 * Import is automatic — TypeScript picks up all .d.ts files in src/.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // ── Server ────────────────────────────────────────────────────────────────
    NODE_ENV:   'development' | 'staging' | 'production' | 'test';
    PORT?:      string;
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'http' | 'debug';
    APP_NAME?:  string;
    APP_URL?:   string;

    // ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET:              string;
    JWT_REFRESH_SECRET:      string;
    JWT_EXPIRES_IN?:         string;
    JWT_REFRESH_EXPIRES_IN?: string;

    // ── CORS ──────────────────────────────────────────────────────────────────
    /** Comma-separated list of allowed origins, e.g. "https://hub.domain.com,..." */
    CORS_ORIGINS?: string;

    // ── Databases (6 × MySQL) ─────────────────────────────────────────────────
    HUB_DATABASE_URL?:     string;
    GAME_DATABASE_URL?:    string;
    TRADE_DATABASE_URL?:   string;
    DATING_DATABASE_URL?:  string;
    SPORTS_DATABASE_URL?:  string;
    ADMIN_DATABASE_URL?:   string;

    // ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL?: string;

    // ── File uploads ──────────────────────────────────────────────────────────
    UPLOAD_DIR?:       string;
    MAX_FILE_SIZE_MB?: string;
    CDN_BASE_URL?:     string;

    // ── Email (Nodemailer / Gmail SMTP) ───────────────────────────────────────
    SMTP_HOST?:  string;
    SMTP_PORT?:  string;
    SMTP_USER?:  string;
    SMTP_PASS?:  string;
    SMTP_FROM?:  string;

    // ── SMS ───────────────────────────────────────────────────────────────────
    SMS_PROVIDER?:          'console' | 'twilio';
    TWILIO_ACCOUNT_SID?:    string;
    TWILIO_AUTH_TOKEN?:     string;
    TWILIO_PHONE_NUMBER?:   string;

    // ── AI Services ───────────────────────────────────────────────────────────
    DEEPSEEK_API_KEY?:      string;
    OPENAI_API_KEY?:        string;
    GOOGLE_TRANSLATE_KEY?:  string;

    // ── WebRTC / TURN ─────────────────────────────────────────────────────────
    TURN_SERVER?: string;
    TURN_USER?:   string;
    TURN_CRED?:   string;

    // ── Security ──────────────────────────────────────────────────────────────
    ENCRYPTION_KEY?:      string;
    OTP_EXPIRE_MINUTES?:  string;
    MAX_LOGIN_ATTEMPTS?:  string;
    LOCKOUT_MINUTES?:     string;

    // ── Backup ────────────────────────────────────────────────────────────────
    BACKUP_RETENTION_DAYS?: string;
    DB_HOST?:               string;
    DB_PORT?:               string;
    DB_USERNAME?:           string;
    DB_PASSWORD?:           string;

    // ── Admin seed defaults ───────────────────────────────────────────────────
    ADMIN_DEFAULT_EMAIL?:    string;
    ADMIN_DEFAULT_PASSWORD?: string;

    // ── Payment gateways ──────────────────────────────────────────────────────
    MOMO_PARTNER_CODE?:       string;
    MOMO_ACCESS_KEY?:         string;
    MOMO_SECRET_KEY?:         string;
    MOMO_IPN_URL?:            string;
    ZALOPAY_APP_ID?:          string;
    ZALOPAY_KEY1?:            string;
    ZALOPAY_KEY2?:            string;
    VNPAY_TMN_CODE?:          string;
    VNPAY_HASH_SECRET?:       string;
    GSC_API_KEY?:             string;
    GSC_SECRET_KEY?:          string;
    GSC_BASE_URL?:            string;
    GOLDGATE_CLIENT_ID?:      string;
    GOLDGATE_CLIENT_SECRET?:  string;
    GOLDGATE_BASE_URL?:       string;
    TCGAMING_MERCHANT_CODE?:  string;
    TCGAMING_DES_KEY?:        string;
    TCGAMING_HASH_KEY?:       string;
    TCGAMING_API_URL?:        string;
    LKVIP_WEBHOOK_SECRET?:    string;
    VIETQR_CLIENT_ID?:        string;
    VIETQR_API_KEY?:          string;

    // ── Feature flags ─────────────────────────────────────────────────────────
    ENABLE_AI?:           string;
    ENABLE_2FA?:          string;
    ENABLE_QUEUE?:        string;
    MAINTENANCE_MODE?:    string;
    ENABLE_PRICE_FEED?:   string;

    // ── CI / Seeding ──────────────────────────────────────────────────────────
    SEED_FORCE?: string;
  }
}
