# VPS Deployment

Tài liệu này đã được hợp nhất.

Nguồn chuẩn hiện tại: [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

Ghi chú:

- LKVIP deploy native trên VPS, không dùng Docker.
- Project root: `/var/LKVIP`.
- PM2 app: `lkvip-api`.
- Backend internal: `127.0.0.1:5000`.
- Public hosts hiện tại: root, hub, trade, sports, admin, api.
- `game` và `dating` chưa có public DNS/Nginx trong cấu hình hiện tại.
