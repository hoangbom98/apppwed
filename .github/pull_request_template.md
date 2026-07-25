## Pull Request

### Summary
<!-- Briefly describe what this PR does and WHY it is needed -->

### Type of Change
- [ ] 🐛 Bug fix (non-breaking, fixes an issue)
- [ ] ✨ New feature (non-breaking, adds functionality)
- [ ] 💥 Breaking change (fix or feature that changes existing behavior)
- [ ] ♻️ Refactor (no behavior change, code quality improvement)
- [ ] 🔒 Security fix
- [ ] ⚡ Performance improvement
- [ ] 📝 Documentation only
- [ ] 🏗️ Infrastructure / DevOps / CI

### Affected Modules
- [ ] Backend (API, services, middlewares)
- [ ] Admin Dashboard
- [ ] Hub SPA
- [ ] Game SPA
- [ ] Dating SPA
- [ ] Trade SPA
- [ ] Sports SPA
- [ ] Shared packages (`@lkvip/ui`, `@lkvip/types`, `@lkvip/constants`)
- [ ] Database schemas / migrations
- [ ] Nginx / deployment scripts

---

### ✅ Code Quality Checklist
- [ ] `pnpm lint:all` passes with **0 warnings**
- [ ] `pnpm typecheck:all` passes with **0 errors**
- [ ] `pnpm test --coverage` passes (coverage ≥ 60% for `src/shared/`)
- [ ] No `console.log` left in production code paths
- [ ] No `@ts-ignore` or `// eslint-disable` added without justification comment

### 🗃️ Database Checklist
- [ ] If Prisma schema changed: migration file created and committed
- [ ] All new financial/monetary fields use `DECIMAL(19,4)` (not `DECIMAL(18,2)` or `FLOAT`)
- [ ] New Wallet/balance tables include `version Int @default(0)` for optimistic locking
- [ ] New Transaction tables have `referenceId @unique` for idempotency
- [ ] Indexes added for all new FK columns, `WHERE` clause columns, `ORDER BY` columns

### 🔒 Security Checklist
- [ ] No hardcoded secrets, credentials, or API keys
- [ ] No new env vars without updating `.env.example`
- [ ] Sensitive fields use AES-256-GCM encryption (`prismaEncryption.ts`)
- [ ] New public endpoints do not leak secret config values
- [ ] Input validation added (Joi for backend, Yup for frontend)

### 🧪 Testing Checklist
- [ ] Unit tests added/updated for new service methods
- [ ] If adding financial logic: optimistic lock and idempotency test cases included
- [ ] Manual test performed for the happy path and at least one error case
- [ ] No existing tests broken

### 📝 Documentation Checklist
- [ ] If API route changed/added: `docs/API_ENDPOINTS.md` updated
- [ ] If architecture/runtime changed: `docs/ARCHITECTURE.md` updated
- [ ] If deploy/env/domain changed: `docs/DEPLOYMENT.md` updated
- [ ] If incident response procedure changed: `docs/INCIDENT_RESPONSE.md` updated

---

### Testing Done
<!-- Describe exactly what you tested. Include curl examples for API changes. -->

### Screenshots (if UI change)
<!-- Attach screenshots or screen recordings -->

### Related Issues
<!-- Closes #123 -->
