---
name: frontend-feature
description: >-
  Implements or extends a client feature module in the EMS React SPA (MUI, feature
  folders, axios httpClient, react-hook-form + Zod). Use when adding/editing pages,
  hooks, API clients, or UI under client/src/features, client/src/components, or
  client routing.
---

# Frontend Feature Workflow

## When to use

Working in `client/` — new feature slice, page, form, or API integration.

## Checklist

```
Progress:
- [ ] 1. Confirm types in @ems/shared (add/update if contract changes)
- [ ] 2. Add/update feature api + hooks
- [ ] 3. Add validation (Zod) + form UI if needed
- [ ] 4. Wire page + route (lazy) + role guard if required
- [ ] 5. Reuse shared components (DataTable, PageHeader, dialogs)
- [ ] 6. typecheck client
```

## Layout

```
client/src/features/<name>/
  api/<name>Api.ts      # httpClient calls only
  hooks/use<Name>.ts    # loading/error/data orchestration
  components/           # feature-local UI
  pages/<Name>Page.tsx  # routed page
  validation.ts         # Zod schemas for forms
  index.ts              # named public exports
```

## Hard rules

1. HTTP only through `httpClient` (`withCredentials` + Bearer already configured).
2. Env only via `client/src/config/env.ts`.
3. UI: MUI + `@mui/icons-material`. No Tailwind.
4. Access token stays in memory — never `localStorage`.
5. Register routes in `app/router/AppRouter.tsx` with `React.lazy`.
6. RBAC in UI is optional UX; server enforces permissions.

## Commands

```bash
npm --prefix shared run build
npm --prefix client run typecheck
npm --prefix client run test
```

## Reference

- Architecture: `docs/TECHNICAL_DOCUMENTATION.md` §10
- Cursor rules: `.cursor/rules/frontend-*.mdc`, `auth-security.mdc`
