# Chính sách tích hợp external

## Boundary

`apps/external/` là source mirror cục bộ của các repository bên ngoài. Mỗi thư mục giữ nested `.git`, không thuộc root Git history, không thuộc pnpm workspace và không tham gia Turbo mặc định.

Chỉ metadata, tooling và tài liệu integration được commit vào LKVIP. Không stage source mirror bằng `git add apps/external/`.

## Source pinning

`config/external/repos.json` là manifest canonical. Mỗi repository phải có `sourceRepo`, destination và commit SHA đã xác minh trước build/deploy. `task-tracker` hiện chưa clone, trạng thái `missing-clone`.

Clone script không reset, xóa hoặc ghi đè checkout hiện hữu. Checkout bẩn, remote sai hoặc SHA sai phải dừng để người vận hành xử lý.

## Workspace

Không thêm glob `apps/external/**` vào `pnpm-workspace.yaml`. Java, Android, React Native, Firebase Functions và nested npm projects dùng toolchain riêng. Chỉ subproject được phê duyệt mới có thể được đăng ký bằng exact path sau khi kiểm tra package name, lockfile, scripts và dependency graph.

Core commands (`pnpm build`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`) không phụ thuộc external.

## Secrets

Không commit `.env`, `.env.local`, credential hoặc private key. Inventory chỉ ghi tên biến môi trường. Repository có secret file hiện tại bị đánh dấu `blocked-secret` trong manifest, không được build/deploy cho tới khi secret được scrub/rotate.

## Integration

Không copy nguyên backend, migration hoặc payment/wallet logic vào core. Port theo domain phải có schema ownership, auth/payment mapping, validator, tests và migration plan riêng. Không dùng port, domain, health endpoint hoặc entrypoint suy đoán từ tên repository.

## Deployment

PM2/Nginx/SSL/CI deploy chỉ được thêm sau khi xác nhận owner, entrypoint, port, bind address, environment contract, healthcheck, domain/DNS/TLS và rollback. External deploy phải rollback độc lập, không restart core service khi chỉ external thay đổi.
