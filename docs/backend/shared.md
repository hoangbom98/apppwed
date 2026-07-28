# Shared Architecture Standards

This directory contains all shared logic for the multi-project ecosystem (Hub, Game, Dating, etc.).

## Directory Standards
- `services/`: Shared business logic. All services must accept `prisma` as the first argument.
- `controllers/`: Base classes and shared utilities for request handling.
- `middlewares/`: Security (RBAC, auth, rate-limiting) and utility middlewares.
- `utils/`: Shared helper functions, validators, and standardized response formats.
- `queue/`: Background task processing.

## Rules
1. **DRY**: No code duplication. If you find yourself writing the same logic twice, move it to `shared/`.
2. **Context Injection**: Controllers must inject `req.prisma` (via `prismaBridge`) into Services.
3. **Audit**: All mutating routes (POST, PUT, DELETE) must use `auditLogger`.
4. **Security**: All admin routes must be secured with RBAC middleware.
