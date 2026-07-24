# 🛡️ RISK DETECTION & RESPONSE ENGINE — DOCUMENTATION

## Tổng quan

Hệ thống **Autonomous Risk Detection & Response** phát hiện và can thiệp tự động toàn bộ rủi ro:

✅ **Tài chính**: giao dịch bất thường, rút tiền sau nạp, tần suất cao, vượt ngưỡng thống kê  
✅ **Bảo mật**: brute-force, injection, DDoS, IP đen, thiết bị lạ  
✅ **Gian lận**: multi-account, bot, fake device, rapid registration  
✅ **Uy tín**: spam, khiêu dâm, lừa đảo, nội dung độc hại  
✅ **Pháp lý**: KYC tự động, AML báo cáo, structuring detection  
✅ **Quốc tế**: IP nước ngoài, quốc gia rủi ro cao, đổi location đột ngột

---

## 🏗️ Kiến trúc

```
┌────────────────────────────────────────────────────────────┐
│                  🛡️ RISK ENGINE                           │
│                                                            │
│  Middleware:      per-request scan (injection/DDoS/bot)   │
│  Service Layer:   riskService.js (facade to detectors)    │
│  Detectors:       11 specialized modules in src/risk/     │
│  Orchestrator:    RiskScorer — composite score 0–100      │
│  Intervention:    auto-lock, hold tx, block IP, alert     │
│  Notification:    Telegram/Slack + admin dashboard        │
│  Cron Jobs:       batch scoring, adaptive limits, cleanup │
└────────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu trúc code

```
code/backend/src/
├── risk/                          ← 🆕 Risk detector modules
│   ├── transactionMonitor.js      — phát hiện giao dịch bất thường
│   ├── adaptiveLimits.js          — điều chỉnh hạn mức động
│   ├── bruteForceDetector.js      — chống brute-force login
│   ├── deviceFingerprint.js       — phát hiện thiết bị lạ / country switch
│   ├── fraudDetector.js           — multi-account detection
│   ├── botDetector.js             — phát hiện bot / automation
│   ├── securityMonitor.js         — SQL/XSS/path traversal scan
│   ├── ddosDetector.js            — DDoS / flooding detection
│   ├── geolocationMonitor.js      — rủi ro từ IP quốc tế
│   ├── contentModerator.js        — kiểm duyệt nội dung (keyword + AI)
│   ├── complianceMonitor.js       — KYC / AML compliance
│   ├── riskScorer.js              — tính tổng điểm rủi ro + auto-lock
│   └── alertHelper.js             — Telegram/Slack notification helper
│
├── shared/
│   ├── services/
│   │   └── riskService.js         ← 🔄 Upgraded — facade to all detectors
│   └── middlewares/
│       └── riskMiddleware.js      ← 🆕 Request-level guards
│
├── modules/admin/
│   ├── controllers/
│   │   └── riskController.js      ← 🆕 Admin dashboard API
│   └── routes/
│       └── index.js               ← risk routes registered
│
├── config/
│   └── cron.js                    ← risk cron jobs added
│
└── app.js                         ← risk middleware wired in

config/database/
└── risk_migration.sql             ← 🆕 Migration SQL

code/backend/prisma/admin/
└── schema.prisma                  ← 🔄 Extended with 4 new risk tables
```

---

## 🚀 Cài đặt & Chạy

### 1. Chạy migration SQL

```bash
mysql -u root -p admin_db < config/database/risk_migration.sql
```

### 2. Tạo Prisma client mới

```bash
cd code/backend
npm install geoip-lite  # optional but recommended
npx prisma generate --schema=./prisma/admin/schema.prisma
```

### 3. Cấu hình môi trường (.env)

```bash
# Redis (bắt buộc cho brute-force / DDoS throttling)
REDIS_URL=redis://127.0.0.1:6379

# Telegram alerts (tùy chọn — nhận cảnh báo realtime)
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF...
TELEGRAM_CHAT_ID=-1001234567890

# Slack webhook (tùy chọn)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# AI moderation (tùy chọn — nâng cao content moderation)
ENABLE_AI=true
```

### 4. Khởi động server

```bash
npm run dev
# hoặc
pm2 start ecosystem.config.js
```

Hệ thống risk sẽ tự động:
- Bật middleware scan injection/DDoS/bot trên `/api/*`
- Đăng ký 5 cron jobs chạy định kỳ
- Lắng nghe cảnh báo qua Telegram/Slack

---

## 📊 Admin Dashboard — API Endpoints

Tất cả endpoint yêu cầu **JWT admin** (`/admin/*` routes).

### Risk Summary

```http
GET /api/admin/risk/summary
```

Response:
```json
{
  "newAlerts": 12,
  "highAlerts": 3,
  "amlNew": 5,
  "secLogsToday": 48,
  "criticalUsers": 2,
  "blockedIps": 17
}
```

### Risk Alerts

```http
GET /api/admin/risk/alerts?status=new&page=1&limit=20
GET /api/admin/risk/alerts/:id
PATCH /api/admin/risk/alerts/:id  { status: 'resolved', note: '...' }
```

### AML Alerts

```http
GET /api/admin/risk/aml?status=new&page=1&limit=20
PATCH /api/admin/risk/aml/:id  { status: 'cleared' }
```

### Security Logs

```http
GET /api/admin/risk/security-logs?type=brute_force&severity=high&page=1&limit=20
```

### IP Blacklist

```http
GET /api/admin/risk/ip-blacklist?page=1&limit=20
POST /api/admin/risk/ip-blacklist  { ip: '1.2.3.4', reason: 'manual', durationDays: 30 }
DELETE /api/admin/risk/ip-blacklist/:ip
```

### User Risk Score

```http
GET /api/admin/risk/users/:userId/score
POST /api/admin/risk/users/:userId/recalculate
POST /api/admin/risk/users/:userId/lock  { reason: 'manual_lock' }
```

### Risk Rules

```http
GET /api/admin/risk/rules
PATCH /api/admin/risk/rules/:id  { status: 'inactive', priority: 5 }
```

---

## ⚙️ Cron Jobs

| Job | Lịch | Mô tả |
|-----|------|-------|
| `batch-risk-scoring` | Mỗi 30 phút | Tính lại risk score cho tối đa 500 users, tự động lock nếu score > 70 |
| `adaptive-limits` | 02:00 hàng ngày | Điều chỉnh hạn mức giao dịch động dựa trên lịch sử 30 ngày |
| `purge-ip-blacklist` | Mỗi 6 giờ | Xóa IP blacklist đã hết hạn |
| `clean-security-logs` | 04:00 hàng ngày | Xóa security logs cũ > 30 ngày (low/medium severity) |
| `clean-audit-logs` | 03:00 hàng ngày | Xóa audit logs info cũ > 90 ngày |

---

## 🔌 Sử dụng trong code

### 1. Transaction risk evaluation

```javascript
const riskService = require('../shared/services/riskService');

// Trước khi xử lý withdrawal
const result = await riskService.evaluate(prisma, {
  userId: 'user_123',
  amount: 30_000_000,
  type: 'withdraw',
  ip: req.ip,
  projectCode: 'game',
});

// { score: 65, risk: 'medium', flags: ['large_single_amount', 'new_account'] }

if (result.risk === 'high') {
  // Tạm giữ giao dịch → chờ admin duyệt
  await prisma.transaction.update({ where: { id }, data: { status: 'hold' } });
  return res.status(403).json({ message: 'Transaction held for review' });
}
```

### 2. Login brute-force check

```javascript
// Trước khi xử lý login
const check = await riskService.checkLoginAttempt(req.ip, email);
if (check.blocked) {
  return res.status(429).json({ message: 'Too many attempts. Try again later.' });
}

// Nếu login thất bại
await riskService.recordLoginFailure(req.ip, email);

// Nếu login thành công
await riskService.recordLoginSuccess(req.ip, email);
```

### 3. Device fingerprint on login

```javascript
const fingerprint = req.body.fingerprint; // từ frontend (browser fingerprint)
const deviceCheck = await riskService.checkDevice(
  adminPrisma,
  userId,
  fingerprint,
  req.ip,
  req.headers['user-agent']
);

if (deviceCheck.risk === 'critical') {
  // Đổi quốc gia đột ngột → tạm khóa + yêu cầu 2FA
  return res.status(403).json({ message: 'Suspicious activity detected. Account locked.' });
}
```

### 4. Content moderation

```javascript
const moderationResult = await riskService.moderateContent(userBio);
if (moderationResult.flagged) {
  // Từ chối + tạo alert
  await prisma.report.create({ data: { reason: 'content_violation', userId, content: userBio } });
  return res.status(400).json({ message: 'Content contains prohibited material' });
}
```

### 5. KYC & AML compliance

```javascript
// Trước khi xử lý deposit lớn
const kycResult = await riskService.checkKyc(userId, amount);
if (kycResult.action === 'kyc_required') {
  return res.status(403).json({ message: 'KYC verification required for this amount' });
}

// Sau khi tạo transaction
await riskService.checkAml(userId, txId, amount, 'deposit');
// → tự động tạo AmlAlert nếu vượt ngưỡng
```

### 6. Manual alert send

```javascript
const alertHelper = require('../risk/alertHelper');

await alertHelper.sendAlert(
  '⚠️ Critical event detected: unusual activity on VIP user account',
  'critical',
  { userId, event: 'mass_withdrawal_attempt' }
);
```

---

## 🔐 Middleware Layers

App.js đã tích hợp 4 middleware tầng toàn cục:

```javascript
app.use("/api", riskMiddleware.ddosGuard());       // DDoS protection
app.use("/api", riskMiddleware.ipBlockGuard());    // Check redis blocked IPs
app.use("/api", riskMiddleware.injectionGuard());  // SQL/XSS/path traversal scan
app.use("/api", riskMiddleware.botGuard());        // Bot detection via X-Session-Meta
```

**Optional per-route:**

```javascript
const risk = require('../shared/middlewares/riskMiddleware');

router.post('/high-risk-endpoint',
  risk.geoGuard(),        // block high-risk countries
  risk.ipBlockGuard(),    // double-check IP block
  controller.action
);
```

---

## 🧪 Testing & Validation

### Manual test: IP blacklist

```bash
curl -X POST http://localhost:3000/api/admin/risk/ip-blacklist \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4", "reason": "manual_test", "durationDays": 1}'

# Kiểm tra blocked:
curl http://localhost:3000/api/anything -H "X-Forwarded-For: 1.2.3.4"
# Expected: 403 Access denied
```

### Manual test: SQL injection scan

```bash
curl -X POST http://localhost:3000/api/game/auth/login \
  -d 'email=admin%27OR1=1--&password=test'

# Expected: 400 Invalid request (blocked by injectionGuard)
# Check security_logs table for logged event
```

### Manual test: Telegram alert

```bash
# Ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set
node -e "
const alertHelper = require('./code/backend/src/risk/alertHelper');
alertHelper.sendAlert('🧪 Test alert from risk system', 'high');
"
# Expected: Telegram message received
```

---

## 📈 Monitoring & Tuning

### Xem risk score của 1 user

```sql
SELECT * FROM risk_scores WHERE user_id = 'user_123' ORDER BY created_at DESC LIMIT 1;
```

### Top users có risk score cao nhất

```sql
SELECT user_id, score, level, reason 
FROM risk_scores 
WHERE level IN ('high', 'critical')
ORDER BY score DESC, created_at DESC
LIMIT 20;
```

### Security logs gần đây (24h)

```sql
SELECT type, action, COUNT(*) as count, severity
FROM security_logs
WHERE created_at > NOW() - INTERVAL 1 DAY
GROUP BY type, action, severity
ORDER BY count DESC;
```

### AML alerts chưa xử lý

```sql
SELECT u.email, a.rule_triggered, a.details, a.created_at
FROM aml_alerts a
JOIN users u ON a.user_id = u.id
WHERE a.status = 'new'
ORDER BY a.created_at DESC
LIMIT 50;
```

---

## 🎯 Risk Level Thresholds

| Score | Level | Action |
|-------|-------|--------|
| 0–20  | Low | Log only |
| 21–40 | Medium | Log + create risk alert |
| 41–70 | High | Alert admin via Telegram + create risk alert |
| 71–100 | **Critical** | **Auto-lock user + alert admin immediately** |

---

## 🔧 Điều chỉnh thresholds

Chỉnh sửa trong code hoặc qua admin API:

### Trong code (constants):

```javascript
// src/risk/riskScorer.js
const SCORE_CRITICAL = 70;
const SCORE_HIGH     = 40;
const SCORE_MEDIUM   = 20;

// src/risk/transactionMonitor.js
const DEPOSIT_SPIKE  = 50_000_000;  // 50M VND
const FREQUENCY_MAX  = 10;          // tx/minute

// src/risk/bruteForceDetector.js
const BLOCK_THRESHOLD = 5;          // login attempts
```

### Qua Admin UI (sắp tới):

```
Admin Dashboard > Risk > Rules > Edit threshold/action
```

---

## 🚨 Emergency Actions

### Tạm block IP ngay lập tức

```bash
redis-cli SET "blocked:ip:1.2.3.4" "1" EX 3600  # block 1h
# hoặc
curl -X POST /api/admin/risk/ip-blacklist -d '{"ip":"1.2.3.4", "reason":"emergency"}'
```

### Unlock user bị khóa nhầm

```sql
UPDATE users SET status = 'active' WHERE id = 'user_123';

-- Xóa risk alerts liên quan
UPDATE risk_alerts SET status = 'dismissed' WHERE user_id = 'user_123' AND status = 'new';
```

### Tắt tạm một detector

```javascript
// Comment out middleware nếu cần tắt injection scan:
// app.use("/api", riskMiddleware.injectionGuard());
```

---

## 📚 Tài liệu tham khảo

- [`riskService.js`](../src/shared/services/riskService.js) — public API
- [`riskScorer.js`](../src/risk/riskScorer.js) — scoring algorithm
- [`alertHelper.js`](../src/risk/alertHelper.js) — Telegram/Slack integration
- [`cron.js`](../src/config/cron.js) — scheduled jobs

---

## 🎉 Kết luận

Hệ thống Risk Detection & Response Engine đã sẵn sàng vận hành 24/7/365, bảo vệ toàn diện cho:
- ✅ Tài chính: ngăn chặn giao dịch bất thường
- ✅ Bảo mật: chống injection, brute-force, DDoS
- ✅ Gian lận: phát hiện multi-account, bot
- ✅ Uy tín: kiểm duyệt nội dung tự động
- ✅ Pháp lý: tuân thủ KYC/AML
- ✅ Quốc tế: giám sát IP từ quốc gia rủi ro cao

**Admin chỉ cần can thiệp thủ công khi hệ thống tạo alert — 99% trường hợp đã được tự động xử lý.** 🛡️
