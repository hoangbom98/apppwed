# Game Launch API Documentation

## Tổng Quan

Hệ thống Game Launch API tích hợp với GSC+ để khởi chạy games từ nhiều nhà cung cấp khác nhau.

## Kiến Trúc

```
Frontend Request
    ↓
GameLaunchController
    ↓
GameCategoryMapping (Ánh xạ category → game_type)
    ↓
GscPlusGameLaunchService
    ↓
GSC+ API (Launch Game)
    ↓
Game URL Response
```

## Ánh Xạ Categories

| Frontend Category | GSC+ Game Type | Mô Tả |
|------------------|----------------|-------|
| {category} | SLOT | Nổ Hũ / Slot Games |
| CASINO | LIVE_CASINO | Casino Trực Tuyến |
| BAN_CA | FISHING | Bắn Cá |
| GAME_BAI | TABLE_GAME | Game Bài |
| THE_THAO | SPORTSBOOK | Thể Thao |
| DA_GA | COCKFIGHTING | Đá Gà |
| XO_SO | LOTTERY | Xổ Số |
| E_SPORTS | E_SPORTS | E-Sports |
| POKER | POKER | Poker |

## Platforms Hỗ Trợ

### SLOT (Nổ Hũ)
- **PG** - PG Soft (Product Code: 1002)
- **JILI** - JILI (Product Code: 1011)
- **JDB** - JDB (Product Code: 1013)
- **PP** - Pragmatic Play (Product Code: 1001)
- **FC** - FaChai (Product Code: 1014)
- **CQ9** - CQ9 (Product Code: 1015)
- **SPADE** - Spade Gaming (Product Code: 1016)
- **JOKER** - Joker (Product Code: 1017)
- **HABANERO** - Habanero (Product Code: 1018)
- **KA** - KA Gaming (Product Code: 1019)
- **NAGA** - Naga Games (Product Code: 1020)

### LIVE_CASINO (Casino)
- **DG** - Dream Gaming (Product Code: 1021)
- **SEXY** - Sexy Baccarat (Product Code: 1022)
- **AG** - Asia Gaming (Product Code: 1023)
- **BB** - Big Gaming (Product Code: 1024)
- **SA** - SA Gaming (Product Code: 1025)
- **WM** - WM Casino (Product Code: 1026)
- **EVO** - Evolution Gaming (Product Code: 1027)
- **PRETTY** - Pretty Gaming (Product Code: 1028)

### FISHING (Bắn Cá)
- **JILI** - JILI Fishing (Product Code: 1011)
- **JDB** - JDB Fishing (Product Code: 1013)
- **CQ9** - CQ9 Fishing (Product Code: 1015)
- **SPADE** - Spade Gaming Fishing (Product Code: 1016)

### TABLE_GAME (Game Bài)
- **V8** - V8 Poker (Product Code: 1029)
- **KY** - KaiYuan Gaming (Product Code: 1030)
- **LEG** - LeGaming (Product Code: 1031)

### SPORTSBOOK (Thể Thao)
- **SABA** - SABA Sports (Product Code: 1012)
- **CMD** - CMD368 (Product Code: 1032)
- **SBO** - SBO Sports (Product Code: 1033)
- **BTI** - BTI Sports (Product Code: 1034)
- **IM** - IM Sports (Product Code: 1035)

## API Endpoints

### 1. Get All Categories
```
GET /api/v1/game/categories
```

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "code": "{category}",
      "game_type": "SLOT",
      "platform_count": 11,
      "platforms": [
        {"code": "PG", "name": "PG Soft"},
        {"code": "JILI", "name": "JILI"},
        {"code": "JDB", "name": "JDB"}
      ]
    }
  ]
}
```

### 2. Get Platforms for Category
```
GET /api/v1/game/platforms?category={category}
```

**Parameters:**
- `category` (optional): Category code ({category}, CASINO, etc.)
  - Nếu không có, trả về tất cả platforms cho tất cả categories

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "category": "{category}",
    "game_type": "SLOT",
    "platforms": [
      {"code": "PG", "name": "PG Soft"},
      {"code": "JILI", "name": "JILI"},
      {"code": "JDB", "name": "JDB"}
    ]
  }
}
```

### 3. Get Games List
```
GET /api/v1/game/list?category={category}&platform=JDB
```

**Parameters:**
- `category` (required): Category code
- `platform` (required): Platform code

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "provider_games": [
      {
        "game_code": "game1",
        "game_name": "Game Name",
        "game_type": "SLOT",
        "image_url": "https://...",
        "product_code": 1013,
        "support_currency": "VND2",
        "status": "ACTIVATED"
      }
    ],
    "pagination": {
      "size": 100,
      "offset": 0,
      "total": 150
    }
  }
}
```

### 4. Launch Game
```
GET /api/v1/game/launch?category={category}&platform=JDB&game_code=xxx&platform_type=WEB
```

**Parameters:**
- `category` (required): Category code ({category}, CASINO, etc.)
- `platform` (required): Platform code (JDB, PG, JILI, etc.)
- `game_code` (optional): Specific game code (nếu không có, mở lobby)
- `platform_type` (optional): WEB, MOBILE, DESKTOP (default: WEB)
- `token` (optional): User authentication token

**Response Success:**
```json
{
  "code": 200,
  "message": "Game launched successfully",
  "data": {
    "game_url": "https://game-provider.com/launch?token=xxx",
    "content": null,
    "platform": "JDB",
    "game_type": "SLOT",
    "game_code": "game1"
  }
}
```

**Response Error:**
```json
{
  "code": 400,
  "message": "Platform JDB not supported for category {category}",
  "supported_platforms": ["PG", "JILI", "PP"],
  "data": null
}
```

## Ví Dụ Sử Dụng

### 1. Launch JDB Slot Game
```bash
curl "http://0.0.0.0:8788/api/v1/game/launch?category={category}&platform=JDB&platform_type=WEB"
```

### 2. Launch PG Soft Specific Game
```bash
curl "http://0.0.0.0:8788/api/v1/game/launch?category={category}&platform=PG&game_code=fortune-tiger&platform_type=MOBILE"
```

### 3. Launch Live Casino (DG)
```bash
curl "http://0.0.0.0:8788/api/v1/game/launch?category=CASINO&platform=DG&platform_type=WEB"
```

### 4. Get Available Platforms for Slots
```bash
curl "http://0.0.0.0:8788/api/v1/game/platforms?category={category}"
```

### 5. Get All Games from JILI
```bash
curl "http://0.0.0.0:8788/api/v1/game/list?category={category}&platform=JILI"
```

## Frontend Integration

### React/Vue Example
```javascript
// Launch game in iframe
async function launchGame(category, platform, gameCode = null) {
  const params = new URLSearchParams({
    category,
    platform,
    platform_type: 'WEB'
  });
  
  if (gameCode) {
    params.append('game_code', gameCode);
  }
  
  const response = await fetch(`/api/v1/game/launch?${params}`);
  const result = await response.json();
  
  if (result.code === 200) {
    // Open game in iframe or new window
    window.open(result.data.game_url, '_blank');
    // Or use iframe
    // document.getElementById('game-iframe').src = result.data.game_url;
  } else {
    console.error('Failed to launch game:', result.message);
  }
}

// Usage
launchGame('{category}', 'JDB'); // Launch JDB lobby
launchGame('{category}', 'PG', 'fortune-tiger'); // Launch specific game
```

### HTML Iframe Example
```html
<div id="game-container">
  <iframe 
    id="game-iframe" 
    width="100%" 
    height="600px" 
    frameborder="0"
    allow="autoplay; fullscreen"
  ></iframe>
</div>

<script>
async function loadGame() {
  const response = await fetch('/api/v1/game/launch?category={category}&platform=JDB');
  const result = await response.json();
  
  if (result.code === 200) {
    document.getElementById('game-iframe').src = result.data.game_url;
  }
}
</script>
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | Success | Game launched successfully |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | User not authenticated |
| 404 | Not Found | Game or platform not found |
| 500 | Internal Server Error | Server error or GSC+ API error |

## Authentication

Hiện tại hệ thống sử dụng guest user cho testing. Để tích hợp authentication:

1. Gửi JWT token trong header:
```
Authorization: Bearer <token>
```

2. Hoặc gửi token trong query parameter:
```
?token=<token>
```

3. Update `getCurrentUser()` method trong `GameLaunchController.php` để decode JWT token thực tế.

## Testing

Chạy test script:
```bash
chmod +x test_game_launch.sh
./test_game_launch.sh
```

## Troubleshooting

### 1. Game không launch được
- Kiểm tra GSC+ config: `curl http://0.0.0.0:8788/api/v1/gscplus/config`
- Kiểm tra platform có được hỗ trợ không
- Xem logs: `tail -f boyue/runtime/logs/webman.log`

### 2. Platform not supported
- Kiểm tra mapping trong `GameCategoryMapping.php`
- Đảm bảo product_code đúng với GSC+ contract

### 3. Authentication failed
- Implement proper JWT authentication
- Update `getCurrentUser()` method

## Files Structure

```
boyue/
├── app/
│   ├── constants/
│   │   └── GameCategoryMapping.php      # Category & platform mapping
│   ├── controller/
│   │   └── api/
│   │       └── GameLaunchController.php # Game launch endpoints
│   └── service/
│       └── GscPlusGameLaunchService.php # GSC+ API integration
├── config/
│   └── route.php                        # Routes configuration
└── test_game_launch.sh                  # Test script
```

## Next Steps

1. ✅ Implement proper JWT authentication
2. ✅ Add game favorites/recent games
3. ✅ Add game search functionality
4. ✅ Implement game balance transfer
5. ✅ Add game history tracking
6. ✅ Implement free round support
7. ✅ Add game maintenance status
8. ✅ Implement game analytics

## Support

Để được hỗ trợ, liên hệ GSC+ support hoặc xem tài liệu:
- GSC+ API Documentation: `GSC+Seamless_Wallet_API_v2.0.6EN.md`
- GSC+ Quickstart: `GSCPLUS_QUICKSTART.md`