## Mô tả thay đổi

<!-- Mô tả ngắn gọn những gì PR này thay đổi và tại sao -->

## Loại thay đổi

- [ ] 🐛 Bug fix (không breaking change)
- [ ] ✨ Feature mới (không breaking change)
- [ ] 💥 Breaking change (sửa làm thay đổi behavior hiện có)
- [ ] 📚 Docs / Comments
- [ ] 🔧 Chore / Refactor / CI

## Liên kết

- Issue/Ticket: #
- Related PR: #

## Checklist

### Code Quality
- [ ] `npm run lint` chạy không có lỗi
- [ ] Không có `console.log` debug còn sót
- [ ] Không có `// TODO` mới chưa được ghi nhận trong issue

### Tests
- [ ] `npm test` pass
- [ ] Đã thêm / cập nhật tests cho logic mới
- [ ] Coverage không giảm so với baseline

### Security
- [ ] Không commit file `.env` hoặc secret
- [ ] Không hardcode credentials, API keys, tokens
- [ ] Input validation đầy đủ (dùng Joi hoặc kiểm tra manual)
- [ ] `npm audit` không có HIGH/CRITICAL vulnerability mới

### Database
- [ ] Nếu thêm/sửa schema → đã tạo Prisma migration tương ứng
- [ ] Migration chạy được (`prisma migrate dev`) trên local

### API
- [ ] Response format nhất quán `{ success, message, data }`
- [ ] HTTP status codes đúng chuẩn (200/201/400/401/403/404/422/500)
- [ ] Đã thêm JSDoc comment cho endpoint mới (cho Swagger)

## Screenshots / Demo (nếu có UI)

<!-- Thêm screenshot trước/sau nếu có thay đổi UI -->

## Cách test

<!-- Mô tả các bước để reviewer reproduce và verify -->

```bash
# Ví dụ
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"Admin@123456"}'
```
