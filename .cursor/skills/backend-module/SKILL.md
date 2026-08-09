---
name: backend-module
description: >-
  Implements or extends an Express domain module in the EMS server (routes →
  controller → service → repository, Zod validation, AppError, RBAC). Use when
  adding/editing APIs under server/src/modules, middleware, db access, or auth.
---

# Backend Module Workflow

## When to use

Working in `server/` — new endpoint, module, migration touchpoint, or auth/RBAC change.

## Checklist

```
Progress:
- [ ] 1. Update @ems/shared DTOs/enums if the API contract changes
- [ ] 2. Add Zod schemas in *.validation.ts
- [ ] 3. Repository SQL (parameterized only)
- [ ] 4. Service business rules + AppError mapping
- [ ] 5. Controller (asyncHandler) + routes (authenticate/authorize/validate)
- [ ] 6. Mount router in routes/index.ts if new module
- [ ] 7. typecheck server (+ tests for pure logic)
```

## Module skeleton

```
server/src/modules/<name>/
  <name>.routes.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.repository.ts
  <name>.validation.ts
  index.ts                 # export router
```

## Hard rules

1. SQL only in repositories; use shared `pool`.
2. Controllers call one service method; no business logic in routes.
3. Throw `AppError` subclasses; let `errorHandler` format JSON.
4. Env only via `server/src/config/env.ts`.
5. Log with pino (`libs/logger`), not `console.log`.
6. Refresh cookie helpers: `common/http/cookies.ts`. Never log tokens.

## Auth wiring example

```typescript
router.use(authenticate);
router.post('/', authorize('admin', 'hr'), validate(schema), asyncHandler(controller.create));
```

## Commands

```bash
npm --prefix shared run build
npm --prefix server run typecheck
npm --prefix server run test
```

## Reference

- Architecture: `docs/TECHNICAL_DOCUMENTATION.md` §6–8
- Cursor rules: `.cursor/rules/backend-*.mdc`, `auth-security.mdc`
