# LKVIP Mobile Native — API Reference

Base URL:
- **Dev (emulator)**: `http://10.0.2.2:5000/api`
- **Staging/Prod**: `https://api.tc-gaming.live/api`

Tất cả request đều kèm header:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## Auth

### POST `/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "email": "...", "role": "USER" }
  }
}
```

### POST `/auth/refresh`
```json
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

### POST `/auth/logout`
```json
// Request (body trống)
// Response 200
{ "success": true }
```

---

## User

### GET `/users/me`
```json
// Response 200
{
  "success": true,
  "data": {
    "id": 1, "email": "user@example.com",
    "username": "user01", "balance": 1000.00,
    "role": "USER", "kycStatus": "VERIFIED"
  }
}
```

---

## Hub

### GET `/hub/dashboard`
### GET `/hub/transactions?page=1&limit=20`

---

## Game

### GET `/game/list`
### POST `/game/bet`

---

## Trade

### GET `/trade/positions`
### POST `/trade/order`

---

## Dating

### GET `/dating/profiles?page=1`
### POST `/dating/like/:userId`

---

## Sports

### GET `/sports/events?date=2024-01-01`
### POST `/sports/bet`

---

## Error responses

```json
// 400 Bad Request
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }

// 401 Unauthorized
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Token expired" } }

// 403 Forbidden
{ "success": false, "error": { "code": "FORBIDDEN", "message": "..." } }

// 500 Internal Server Error
{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "..." } }
```
