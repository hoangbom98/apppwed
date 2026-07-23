# API Endpoints Reference

All APIs served at base URL: `http://localhost:5000/api`

Authentication: `Authorization: Bearer <JWT>`

---

## Hub — `/api/hub`

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | Danh sách categories |
| GET | `/games` | Danh sách games |
| GET | `/games/:slug` | Chi tiết game |
| GET | `/websites` | Danh sách websites |
| GET | `/tools` | Danh sách tools |
| GET | `/tools/:slug` | Chi tiết tool |
| GET | `/news` | Danh sách tin tức |
| GET | `/news/:slug` | Chi tiết bài viết |
| GET | `/pages/:slug` | CMS page |
| GET | `/banners` | Banners |
| GET | `/menus/:location` | Menu items |
| GET | `/search` | Tìm kiếm |
| POST | `/feedback` | Gửi phản hồi |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |

### Protected (Bearer required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Thông tin user |
| PUT | `/profile` | Cập nhật profile |
| PUT | `/profile/password` | Đổi mật khẩu |
| GET | `/notifications` | Danh sách thông báo |
| PUT | `/notifications/:id/read` | Đánh dấu đã đọc |
| GET | `/favorites` | Yêu thích |
| POST | `/favorites` | Thêm yêu thích |
| DELETE | `/favorites/:id` | Xóa yêu thích |

---

## Game — `/api/game`

### Public
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| GET | `/games` | Danh sách games |
| GET | `/games/:slug` | Chi tiết game |
| GET | `/game-categories` | Danh mục |
| GET | `/promotions` | Khuyến mãi |
| GET | `/vip/levels` | VIP levels |

### Protected
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/me` | Thông tin user |
| GET | `/wallet/balance` | Số dư |
| GET | `/wallet/history` | Lịch sử giao dịch |
| POST | `/wallet/deposit` | Nạp tiền |
| POST | `/wallet/withdraw` | Rút tiền |
| GET | `/vip/me` | VIP của tôi |
| POST | `/sessions/launch` | Khởi động game |

### Game Providers (callbacks — no auth)
| Method | Endpoint | Provider |
|---|---|---|
| POST | `/callbacks/gsc` | GSC Plus |
| POST | `/callbacks/goldgate/balance` | Goldgate |
| POST | `/callbacks/goldgate/transaction` | Goldgate |
| POST | `/callbacks/tc-gaming/seamless` | TC Gaming |

---

## Trade — `/api/trade`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/pairs` | Danh sách cặp giao dịch |
| GET | `/pairs/:symbol/orderbook` | Order book |
| GET | `/orders` | Danh sách lệnh (auth) |
| POST | `/orders` | Đặt lệnh (auth) |
| DELETE | `/orders/:id` | Huỷ lệnh (auth) |
| GET | `/wallet` | Số dư (auth) |
| POST | `/wallet/deposit` | Nạp tiền (auth) |
| GET | `/kyc` | Trạng thái KYC (auth) |
| POST | `/kyc` | Nộp KYC (auth) |

---

## Dating — `/api/dating`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/send-otp` | Gửi OTP |
| POST | `/auth/login` | Đăng nhập |
| GET | `/users/discovery` | Discover profiles (auth) |
| POST | `/match/like/:id` | Like (auth) |
| POST | `/match/nope/:id` | Nope (auth) |
| GET | `/match/list` | Danh sách matches (auth) |
| GET | `/chat/conversations` | Conversations (auth) |
| POST | `/chat/send` | Gửi tin nhắn (auth) |
| GET | `/live/streams` | Livestreams (auth) |
| POST | `/live/start` | Bắt đầu live (auth) |
| POST | `/gifts/send` | Gửi quà (auth) |
| GET | `/feed` | Feed posts (auth) |
| POST | `/stories/create` | Tạo story (auth) |

---

## Sports — `/api/sports`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/leagues` | Danh sách giải đấu |
| GET | `/matches` | Danh sách trận đấu |
| GET | `/matches/live` | Trận đang diễn ra |
| GET | `/standings/:leagueId` | Bảng xếp hạng |
| GET | `/highlights` | Highlights |
| GET | `/videos` | Short videos |
| GET | `/news` | Tin tức |
| GET | `/streams` | Livestreams |
| GET | `/betting/events` | Sự kiện cược |
| POST | `/betting/bets` | Đặt cược (auth) |
| GET | `/wallet` | Số dư (auth) |

---

## Admin — `/api/admin`

> All routes (except `/auth/login`) require Admin JWT.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Admin đăng nhập |
| GET | `/dashboard` | Stats tổng quan |
| GET | `/stats` | Extended stats |
| GET | `/users` | Danh sách users |
| GET | `/users/:id` | Chi tiết user |
| PATCH | `/users/:id/status` | Thay đổi trạng thái |
| GET | `/finance/deposits` | Danh sách nạp tiền |
| PATCH | `/finance/deposits/:id/approve` | Duyệt nạp tiền |
| GET | `/finance/withdrawals` | Danh sách rút tiền |
| PATCH | `/finance/withdrawals/:id/approve` | Duyệt rút tiền |
| GET | `/game/config` | Game configs |
| GET | `/settings` | System settings |
| PUT | `/settings/:key` | Cập nhật setting |
| GET | `/announcements` | Thông báo hệ thống |
| POST | `/announcements` | Tạo thông báo |
| GET | `/logs` | Audit logs |
| GET | `/ui-config` | UI/Branding config |
| PUT | `/ui-config` | Bulk update UI config |

---

## LKvip — `/api/lkvip`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/deposit/create-va` | Tạo virtual account |
| POST | `/webhooks/internal` | Deposit webhook |
| POST | `/withdraw/create` | Tạo lệnh rút tiền |
| GET | `/balance` | Số dư ví |

---

## Health & Monitoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Full health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs.json` | OpenAPI spec |
