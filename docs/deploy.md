# Deploy

Tài liệu này đã được hợp nhất.

Nguồn chuẩn hiện tại: [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

Lệnh deploy chính:

```bash
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh
```

CI deploy: `.github/workflows/deploy.yml`.

Health deploy hợp lệ khi `/health` trả JSON `status: "healthy"`, không chỉ HTTP 200.
