# Enterprise Employee & Project Management System — Technical Documentation

**Version:** 0.1.0  ·  **Status:** All 12 modules complete, E2E-verified, adversarially reviewed & hardened.

This document is the complete technical reference for the system: architecture, folder
structure, database schema, REST API, shared type contract, backend and frontend design, the
security review findings and remediations, and how to build/run everything.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Monorepo & Tooling](#3-monorepo--tooling)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema](#5-database-schema)
6. [Backend Architecture](#6-backend-architecture)
7. [Authentication, Authorization & Security](#7-authentication-authorization--security)
8. [REST API Reference](#8-rest-api-reference)
9. [Shared Type Contract](#9-shared-type-contract)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Module Reference](#11-module-reference)
12. [Cross-Cutting Patterns](#12-cross-cutting-patterns)
13. [Adversarial Security Review — Findings & Remediation](#13-adversarial-security-review--findings--remediation)
14. [Verification & Testing](#14-verification--testing)
15. [Build, Run & Scripts](#15-build-run--scripts)
16. [Known Limitations & Roadmap](#16-known-limitations--roadmap)
17. [Appendix](#17-appendix)

---

## 1. Overview

An enterprise-grade **Employee & Project Management System** with 12 functional modules:
Authentication, Dashboard, Departments, Employees, Projects, Tasks, Leave Management,
Attendance, Notifications, Reports, User Profile, and Settings.

It is a **full-stack TypeScript monorepo**:

- **`client/`** — React SPA (Vite + Material UI), feature-based architecture.
- **`server/`** — Express REST API (PostgreSQL), layered `route → controller → service → repository`.
- **`shared/`** — Framework-agnostic TypeScript types that form the API contract, imported by
  both the client and the server so the compiler enforces request/response shapes on both sides.

Design principles: clean architecture, feature/domain modules, separation of concerns, SOLID,
type safety end-to-end, a reusable design system, and production-oriented error handling,
logging, validation, and RBAC.

---

## 2. Technology Stack

### Frontend (`client/`)
| Package | Version | Purpose |
|---|---|---|
| react / react-dom | ^18.3.1 | UI runtime |
| @mui/material, @mui/icons-material | ^6.3.0 | Component library + icons |
| @emotion/react, @emotion/styled | ^11.14.0 | MUI styling engine |
| react-router-dom | ^7.1.1 | Routing (used as a library) |
| axios | ^1.7.9 | HTTP client |
| react-hook-form | ^7.80.0 | Forms |
| @hookform/resolvers | ^5.4.0 | Zod resolver bridge |
| zod | ^4.4.3 | Client-side form validation |
| **build** vite | ^6.0.7 | Dev server + bundler |
| @vitejs/plugin-react | ^4.3.4 | React Fast Refresh / JSX |

### Backend (`server/`)
| Package | Version | Purpose |
|---|---|---|
| express | ^4.21.2 | HTTP framework |
| pg | ^8.13.1 | PostgreSQL driver (connection pool) |
| zod | ^3.24.1 | Request validation |
| jsonwebtoken | ^9.0.3 | JWT sign/verify |
| bcryptjs | ^3.0.3 | Password hashing |
| cookie-parser | ^1.4.7 | Parse the httpOnly refresh cookie |
| cors | ^2.8.5 | CORS with credentials |
| helmet | ^8.0.0 | Security headers |
| pino / pino-http | ^9.5.0 / ^10.3.0 | Structured logging |
| ws | ^8.21.1 | WebSocket server (realtime notifications / task events) |
| multer | ^2.2.0 | Avatar file uploads (multipart) |
| swagger-ui-express + js-yaml | ^5 / ^4 | Serve the OpenAPI docs at `/api/docs` |
| dotenv | ^16.4.7 | Env loading |
| **dev** tsx | ^4.19.2 | TS execution (dev, migrate, seed) |
| pino-pretty | ^13.0.0 | Pretty dev logs |
| **test** vitest | ^4 | Unit tests |

Client dev/test: **vitest**, **@testing-library/react**, **@testing-library/jest-dom**, **jsdom**.
Root tooling adds **eslint-plugin-react-hooks** (Rules of Hooks enforcement).

### Shared / Tooling
- **TypeScript** ^5.7.2 across all three packages.
- **Node.js** `>= 20` (pinned to `22` in `.nvmrc`).
- **PostgreSQL** 14+ (uses `pgcrypto` for `gen_random_uuid()` and `citext`).
- ESLint 9 (flat config) + Prettier 3 at the repo root.

### Explicitly excluded (per project constraints)
Next.js, Redux Toolkit, Zustand, Tailwind, Firebase, MongoDB, Prisma, Supabase, NestJS, GraphQL.

---

## 3. Monorepo & Tooling

```
employee-project-mgmt/
├─ client/                 # React SPA
├─ server/                 # Express API
├─ shared/                 # Isomorphic TS contract (@ems/shared)
├─ docs/                   # This document
├─ package.json            # Root: orchestration scripts + eslint/prettier
├─ tsconfig.base.json      # Shared compiler options the packages extend
├─ eslint.config.mjs       # Flat ESLint config (whole repo)
├─ .prettierrc.json
├─ .editorconfig
├─ .nvmrc                  # 22
└─ .gitignore
```

**No npm workspaces.** Each package has its own `node_modules`. `server` and `client` consume
`shared` via a `file:../shared` dependency (`"@ems/shared": "file:../shared"`). Server/client
scripts run `npm --prefix ../shared run build` in a `prebuild`/`predev`/`pretypecheck` step so the
shared package's `dist/` is always current before compilation.

> **Note:** the sandbox's `npm install` also injects a `employee-project-mgmt: file:..`
> back-reference into `server`/`client`/`shared` `package.json` files. It is harmless (the root
> package is private with dev-only deps) and does not affect the build.

**Root scripts** (`package.json`):
| Script | Action |
|---|---|
| `npm run dev` | Runs server + client together via `concurrently` |
| `npm run build` | Builds shared → server → client |
| `npm run migrate` | Applies DB migrations |
| `npm run typecheck` | Type-checks server + client |
| `npm run lint` / `format` | ESLint / Prettier over the repo |

**`tsconfig.base.json`** (extended by all packages): `target ES2022`, `strict`, `esModuleInterop`,
`skipLibCheck`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`,
`noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`. Server uses `module CommonJS` /
`moduleResolution Node`; client overrides to `module ESNext` / `moduleResolution Bundler` /
`jsx react-jsx` / `noEmit` (Vite emits).

---

## 4. Folder Structure

### 4.1 `server/`

```
server/
├─ .env.example
├─ tsconfig.json
├─ package.json
└─ src/
   ├─ index.ts                 # Bootstrap: build app, listen, graceful shutdown
   ├─ app.ts                   # Express assembly (middleware order)
   ├─ config/
   │  └─ env.ts                # Zod-validated env (fail-fast at boot)
   ├─ libs/
   │  ├─ logger.ts             # pino instance
   │  ├─ jwt.ts                # sign/verify access & refresh tokens
   │  └─ password.ts           # bcrypt hash/compare
   ├─ db/
   │  ├─ pool.ts               # single pg.Pool + pingDatabase()
   │  ├─ migrate.ts            # transactional migration runner
   │  ├─ seed.ts               # idempotent admin seed
   │  └─ migrations/
   │     ├─ 001_init.sql       # full schema
   │     └─ 002_employee_code_seq.sql
   ├─ common/
   │  ├─ errors/               # AppError hierarchy + index
   │  ├─ http/
   │  │  ├─ asyncHandler.ts    # wrap async controllers → next(err)
   │  │  ├─ pagination.ts      # buildPaginationMeta()
   │  │  └─ cookies.ts         # refresh-cookie set/clear
   │  ├─ validation/parse.ts   # parseWith(schema, data) → ValidationError
   │  ├─ db/
   │  │  ├─ pgErrors.ts        # PG_ERROR codes + pgErrorCode()
   │  │  └─ employees.ts       # findEmployeeIdByUserId()
   │  └─ types/express.d.ts    # augments Request with `user`
   ├─ realtime/
   │  └─ realtime.ts           # WebSocket server (JWT auth, per-user push, heartbeat)
   ├─ middleware/
   │  ├─ authenticate.ts       # verify Bearer access token → req.user
   │  ├─ authorize.ts          # RBAC role check factory
   │  ├─ validate.ts           # body validation middleware
   │  ├─ errorHandler.ts       # central error → JSON envelope (registered last)
   │  └─ notFound.ts           # 404 for unmatched routes
   ├─ modules/                 # one folder per feature (see §11)
   │  ├─ health/  auth/  departments/  employees/  projects/
   │  ├─ tasks/  leave/  attendance/  notifications/  reports/
   │  ├─ profile/  settings/  dashboard/
   └─ routes/index.ts          # mounts every module router under /api/v1
```

Each feature module is: `X.routes.ts`, `X.controller.ts`, `X.service.ts`, `X.repository.ts`,
`X.validation.ts`, `index.ts` (barrel exporting the router).

### 4.2 `client/`

```
client/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ .env.example              # VITE_API_URL
└─ src/
   ├─ main.tsx                # ReactDOM root
   ├─ App.tsx                 # <AppProviders><AppRouter/></AppProviders>
   ├─ vite-env.d.ts
   ├─ app/
   │  ├─ providers/AppProviders.tsx   # composed global providers
   │  ├─ ErrorBoundary.tsx            # top-level class error boundary
   │  ├─ router/
   │  │  ├─ AppRouter.tsx             # lazy routes
   │  │  ├─ ProtectedRoute.tsx        # auth guard (3-state)
   │  │  ├─ RoleRoute.tsx             # role guard
   │  │  └─ NotFoundPage.tsx
   │  └─ layouts/
   │     ├─ AppLayout.tsx             # sidebar + topbar (role-filtered nav, bell, avatar)
   │     └─ AuthLayout.tsx            # centered card for /login
   ├─ features/               # one folder per module (api/hooks/components/pages + index barrel)
   │  ├─ auth/ dashboard/ departments/ employees/ projects/ tasks/
   │  ├─ leave/ attendance/ notifications/ reports/ profile/ settings/
   ├─ components/             # shared design system
   │  ├─ ui/{Button, DataTable, SearchBar}
   │  ├─ feedback/{EmptyState, ErrorState, PageLoader, ConfirmDialog}
   │  └─ layout/PageHeader
   ├─ contexts/{AuthContext, SnackbarContext}
   ├─ hooks/{useDebounce, useDisclosure}
   ├─ lib/http/{client, index}        # Axios instance + interceptors
   ├─ lib/realtime/{socket, RealtimeProvider}  # WebSocket client + provider
   ├─ theme/index.ts                  # MUI theme
   └─ config/{env, routes}
```

### 4.3 `shared/`

```
shared/src/
├─ enums/index.ts    # RoleName, EmploymentStatus, ProjectStatus, TaskStatus, PriorityLevel,
│                    # AttendanceStatus, LeaveType, LeaveStatus, NotificationType
├─ types/            # api, auth, domain, department, employee, project, task, leave,
│                    # attendance, notification, report, settings, dashboard
└─ index.ts          # public barrel (export * from enums + types)
```

---

## 5. Database Schema

PostgreSQL, targeting 3rd normal form. All primary keys are **UUID** (`gen_random_uuid()`),
all timestamps are **`TIMESTAMPTZ`** defaulting to `now()`, and every foreign key is explicitly
indexed. Defined in `server/db/migrations/001_init.sql` (+ `002_employee_code_seq.sql`).

### 5.1 Extensions & helpers
- `pgcrypto` — `gen_random_uuid()`
- `citext` — case-insensitive email
- `set_updated_at()` trigger function — maintains `updated_at` on UPDATE (attached per table)

### 5.2 Enumerated types
| Enum | Values |
|---|---|
| `employment_status` | probation, active, on_leave, terminated |
| `project_status` | planning, active, on_hold, completed, cancelled |
| `task_status` | todo, in_progress, in_review, blocked, done |
| `priority_level` | low, medium, high, critical (shared by projects & tasks) |
| `attendance_status` | present, absent, late, half_day, remote |
| `leave_type` | annual, sick, casual, unpaid, maternity, paternity |
| `leave_status` | pending, approved, rejected, cancelled |
| `notification_type` | task_assigned, task_updated, leave_status, project_update, mention, system |

### 5.3 Tables

**`roles`** — RBAC lookup. `id`, `name` VARCHAR(50) UNIQUE, `description`, `created_at`.
Seeded with: admin, hr, manager, employee.

**`users`** — authentication identity.
`id`, `email` CITEXT UNIQUE, `password_hash` TEXT, `role_id` → roles (ON DELETE **RESTRICT**),
`is_active` BOOL default true, `last_login_at`, `created_at`, `updated_at`.
Index: `idx_users_role_id`.

**`departments`**.
`id`, `name` VARCHAR(120) UNIQUE, `description`, `head_id` → employees (ON DELETE **SET NULL**,
added via ALTER after `employees` exists to resolve the circular FK), timestamps.
Index: `idx_departments_head_id`.

**`employees`** — HR profile (1:1 with users).
`id`, `user_id` → users UNIQUE (ON DELETE **CASCADE**), `employee_code` VARCHAR(20) UNIQUE,
`first_name`, `last_name`, `phone`, `job_title`, `department_id` → departments (**RESTRICT**),
`manager_id` → employees self-ref (**SET NULL**), `status` employment_status default 'probation',
`hire_date` DATE, `date_of_birth`, `avatar_url`, timestamps.
CHECK `chk_emp_manager_not_self` (manager_id ≠ id).
Indexes: department_id, manager_id, status.

**`projects`**.
`id`, `code` VARCHAR(20) UNIQUE, `name`, `description`, `department_id` → departments (SET NULL),
`project_manager_id` → employees (**RESTRICT**), `status` project_status default 'planning',
`priority` priority_level default 'medium', `start_date`, `end_date`, `budget` NUMERIC(14,2),
timestamps. CHECK `chk_project_dates` (end_date ≥ start_date). Indexes: department_id,
project_manager_id, status.

**`project_members`** — M:N junction (projects ↔ employees).
PK (`project_id`, `employee_id`), both FKs **CASCADE**; `role_on_project`, `allocated_at`.
Index on employee_id (for reverse lookups; PK covers the leading project_id).

**`tasks`**.
`id`, `project_id` → projects (**CASCADE**), `parent_task_id` → tasks self-ref (**CASCADE**),
`title`, `description`, `assignee_id` → employees (**SET NULL**), `reporter_id` → employees
(**SET NULL**), `status` task_status default 'todo', `priority` default 'medium', `due_date`,
`estimated_hours` NUMERIC(6,2), timestamps. CHECK hours ≥ 0.
Indexes: project_id, assignee_id, parent_task_id, and composite (project_id, status).

**`comments`** — scoped to tasks (NOT polymorphic).
`id`, `task_id` → tasks (**CASCADE**), `author_id` → employees (**SET NULL**, preserves comment
if author leaves), `body` TEXT, timestamps. CHECK non-empty body. Indexes: task_id, author_id.

**`attendance`** — one row per employee per day.
`id`, `employee_id` → employees (**CASCADE**), `work_date` DATE, `check_in_at`, `check_out_at`,
`status` attendance_status default 'present', `notes`, timestamps.
UNIQUE (`employee_id`, `work_date`) — the once-per-day guard (also serves as the index).
CHECK check_out_at ≥ check_in_at.

**`leave_requests`** — approval workflow.
`id`, `employee_id` → employees (**CASCADE**), `type` leave_type, `status` leave_status default
'pending', `start_date` DATE, `end_date` DATE, `reason`, `approver_id` → employees (**SET NULL**),
`decided_at`, timestamps. CHECK end_date ≥ start_date. Indexes: employee_id, status, approver_id.

**`notifications`** — per-user feed.
`id`, `user_id` → users (**CASCADE**), `type` notification_type, `title`, `message`, `is_read`
BOOL default false, `entity_type` VARCHAR(40) + `entity_id` UUID (intentional FK-less soft
reference for deep-linking), `created_at`, `read_at`.
Indexes: partial `(user_id, created_at DESC) WHERE is_read = FALSE`, and `(user_id, created_at DESC)`.

**`password_reset_tokens`** — `id`, `user_id` → users (CASCADE), `token_hash` (store a hash, not
the token), `expires_at`, `used_at`, `created_at`. Indexes: user_id, token_hash.
*(Table present for the forgot/reset-password flow; endpoints not yet implemented.)*

**`user_settings`** — 1:1 with users.
`user_id` PK → users (CASCADE), `theme` VARCHAR(10) default 'system' (CHECK in
light/dark/system), `locale` default 'en', `email_notifications` BOOL default true,
`in_app_notifications` BOOL default true, `updated_at`.

**`schema_migrations`** — created by the migration runner: `filename` PK, `applied_at`.

**`employee_code_seq`** (migration 002) — sequence starting at 2, so API-created employees get
`EMP-00002`, `EMP-00003`, … while the seeded admin keeps `EMP-00001`.

### 5.4 Relationship summary
| Relationship | Type | Mechanism |
|---|---|---|
| role → users | 1:N | users.role_id |
| user → employee | 1:1 | employees.user_id UNIQUE |
| department → employees | 1:N | employees.department_id |
| department ↔ head | 1:1 (nullable) | departments.head_id |
| employee → employee (manager) | 1:N self-ref | employees.manager_id |
| employee → projects (PM) | 1:N | projects.project_manager_id |
| projects ↔ employees (members) | **M:N** | project_members |
| project → tasks | 1:N | tasks.project_id |
| task → task (subtasks) | 1:N self-ref | tasks.parent_task_id |
| task → comments | 1:N | comments.task_id |
| employee → attendance | 1:N | attendance.employee_id |
| employee → leave_requests | 1:N | leave_requests.employee_id |
| user → notifications | 1:N | notifications.user_id |
| user → settings | 1:1 | user_settings.user_id |

### 5.5 Migration runner
`server/src/db/migrate.ts` applies each `*.sql` file in `migrations/` in filename order, **inside
a transaction**, and records applied filenames in `schema_migrations` (idempotent, re-runnable).
Run via `npm run migrate` (uses `tsx`, reads from `db/migrations`). `db/seed.ts` (`npm run
seed`) creates the admin user + employee transactionally, idempotently.

---

## 6. Backend Architecture

### 6.1 Layered pattern
```
HTTP → routes → middleware (authenticate, authorize, validate)
     → controller (HTTP only: read req, call ONE service method, shape res)
     → service   (business rules; no req/res; maps rows → DTOs; translates DB errors)
     → repository (the ONLY place SQL lives)
     → PostgreSQL
```
Each layer has a single responsibility and depends only on the layer below.

### 6.2 Request lifecycle (`app.ts` middleware order)
`helmet` → `cors({ origin: CORS_ORIGIN, credentials: true })` → `express.json()` →
`express.urlencoded()` → `cookieParser()` → `pino-http` → `/api/v1` router →
`notFound` → `errorHandler` (must be last). `createApp()` returns the app without calling
`listen()` (testable); `index.ts` starts it and handles graceful shutdown on SIGTERM/SIGINT.

### 6.3 Config (`config/env.ts`)
Zod schema validates `process.env` at boot and **exits(1)** on failure (fail-fast). Everything
reads the typed `env` object; nothing reads `process.env` directly. Keys: `NODE_ENV`, `PORT`,
`DATABASE_URL`, `PG_POOL_MAX`, `JWT_ACCESS_SECRET` (≥16), `JWT_REFRESH_SECRET` (≥16),
`JWT_ACCESS_TTL` (default 15m), `JWT_REFRESH_TTL` (default 7d), `BCRYPT_ROUNDS` (8–15, default 12),
`CORS_ORIGIN`, `LOG_LEVEL`.

### 6.4 Database access (`db/pool.ts`)
A single process-wide `pg.Pool` (max = `PG_POOL_MAX`, idle 30s, connect timeout 5s), an idle-error
handler, and `pingDatabase()` for the readiness probe. Repositories import `pool`; they never
create their own.

### 6.5 Error architecture
- **`common/errors/AppError.ts`** — abstract base with `statusCode`, `code` (`ApiErrorCode`),
  optional `details`, `isOperational`. Subclasses: `ValidationError` (400), `UnauthenticatedError`
  (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `RateLimitError` (429).
- **`middleware/errorHandler.ts`** — the single translator. Known `AppError` → its status/code/message
  (+ details); anything else → 500 `INTERNAL` with the message hidden in production. Logs 5xx at
  error level, 4xx at warn.
- **`common/http/asyncHandler.ts`** — wraps async controllers so rejected promises reach the error
  handler (Express 4 doesn't catch async throws).

### 6.6 Shared server utilities
- `common/validation/parse.ts` → `parseWith<S extends ZodType>(schema, data): z.infer<S>` — throws
  `ValidationError` with per-field `details`. Used by `validate` middleware (bodies) and controllers
  (query params). *(Generic must infer the schema's output type — see review note in code.)*
- `common/http/pagination.ts` → `buildPaginationMeta(page, limit, total)`.
- `common/db/pgErrors.ts` → `PG_ERROR` (`UNIQUE_VIOLATION 23505`, `FOREIGN_KEY_VIOLATION 23503`,
  `CHECK_VIOLATION 23514`) + `pgErrorCode(err)`.
- `employees.repository.findEmployeeIdByUserId(userId)` → resolve employee id from user id.
- `common/http/cookies.ts` → sets/clears the refresh cookie with identical attributes.

### 6.7 Logging
`libs/logger.ts` — pino; pretty transport in development, JSON in production. `pino-http` logs
each request with a request id.

### 6.8 Realtime (WebSockets) — `realtime/realtime.ts`
A `ws` `WebSocketServer` is attached to the **same HTTP server** at path **`/ws`** (via
`initRealtime(server)` in `index.ts`; `closeRealtime()` runs during graceful shutdown). Clients
connect to `ws(s)://<host>/ws?token=<accessToken>`; the server verifies the access token at
connect time (`verifyAccessToken`) and **closes with code 1008** if it's missing/invalid. Valid
sockets are registered in a `Map<userId, Set<socket>>`, enabling:
- `emitToUser(userId, payload)` — push to all of one user's sockets.
- `emitToAll(payload)` — broadcast to every client.

A 30-second **ping/pong heartbeat** reaps dead connections. The REST API remains the source of
truth; WebSocket messages are lightweight "something changed, refresh" signals (the notification
message also carries the `NotificationDTO`).

**Emitters wired today:**
- `notifications.service.notifyUser` → after inserting the row, `emitToUser(recipient,
  { type:'notification', notification })`. (So e.g. approving leave pushes a live notification to
  the requester.)
- `tasks.service.updateStatus` → `emitToAll({ type:'task_updated', taskId, status })`.

---

## 7. Authentication, Authorization & Security

### 7.1 Token model
- **Access token** — JWT, ~15 min, sent as `Authorization: Bearer`, payload `{ sub, role, type:'access' }`.
  Carries the role so `authorize` does RBAC with no DB hit.
- **Refresh token** — JWT, ~7 days, delivered as an **httpOnly, SameSite=Lax, path=/api/v1/auth**
  cookie (Secure in production). Payload `{ sub, type:'refresh' }`. Separate secret.
- `libs/jwt.ts` signs/verifies both; `libs/password.ts` wraps bcrypt.

### 7.2 Middleware
- **`authenticate`** — reads the Bearer token, verifies it, sets `req.user = { id, role }`; 401 on
  missing/invalid.
- **`authorize(...roles)`** — factory; 403 if `req.user.role` is not allowed. Runs after `authenticate`.
- **`validate(schema)`** — validates `req.body` and replaces it with the parsed/coerced value; 400
  with field details on failure.

`Request` is augmented with `user?: { id: string; role: RoleName }` in `common/types/express.d.ts`.

### 7.3 Flow
- **Login** → verify email (case-insensitive) + bcrypt password → issue access (body) + refresh
  (cookie) → returns `{ accessToken, user }`. Uniform `Invalid email or password` for
  unknown-email / disabled / wrong-password (prevents account enumeration).
- **Refresh** → reads the cookie, verifies, re-checks `is_active`, rotates both tokens.
- **Logout** → bumps the user's `token_version` (revoking all outstanding refresh tokens) and
  clears the cookie (204).
- **Token revocation** → refresh tokens carry the `token_version` they were issued with; on
  refresh the server compares it to `users.token_version` and rejects stale tokens. The version is
  bumped on **logout**, **password change**, and **password reset**, so those actions invalidate
  existing sessions.
- **Rate limiting** → `/auth/login` and `/auth/forgot-password` use an in-memory fixed-window
  limiter keyed by IP + email (429 on exceed).
- **Password reset** → `/auth/forgot-password` stores a **sha256 hash** of a random token
  (1-hour expiry, single-use) and returns 200 regardless of whether the email exists (no
  enumeration); `/auth/reset-password` verifies the hash, updates the password, and revokes sessions.
- **Avatar upload** → `POST /profile/avatar` (multer, 2 MB, image types only) stores the file
  under `server/uploads/avatars/` served at `/uploads`; the URL uses `PUBLIC_URL`.
- **Session bootstrap (client)** → on load, calls `/auth/refresh` to re-establish the session from
  the surviving cookie.
- **401 → refresh-and-retry (client)** → the Axios interceptor transparently refreshes and replays
  the original request, with a single-flight guard + queue for concurrent 401s, skipping `/auth/*`
  and retrying at most once.

### 7.4 RBAC & data-scoping summary
Roles: `admin`, `hr`, `manager`, `employee`. Highlights (full matrix in §8):
- Employees/Departments writes: admin/hr; delete: admin.
- Projects/Tasks writes: admin/manager.
- Leave decisions (approve/reject): admin/hr/manager, **and not the requester** (segregation of
  duties). Cancel: owner only.
- Task status change: admin/manager **or** the task's assignee/reporter.
- Reports: admin/hr/manager.
- Notifications/Profile/Settings: strictly scoped to the current user in the repository queries.
- **Role assignment on employee creation:** only an admin may grant `admin`/`hr`.

The client mirrors these with role-filtered navigation and a `RoleRoute` guard, but **all
enforcement is server-side** (the client checks are UX only).

---

## 8. REST API Reference

Base URL: **`/api/v1`**. Auth: `Bearer <accessToken>` unless noted. Envelopes:
- Success (single): `{ "data": T }`
- Success (list): `{ "data": T[], "meta": { "pagination": { page, limit, total, totalPages } } }`
- Error: `{ "error": { "code": ApiErrorCode, "message": string, "details?": [{field,message}] } }`

`ApiErrorCode` ∈ `VALIDATION_ERROR | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL`.
Standard list query params: `page` (≥1, default 1), `limit` (1–100, default 20), `sort`
(`field:asc|desc`), `search`, plus per-module filters.

Status codes used: 200, 201, 204, 400, 401, 403, 404, 409, 500.

### 8.1 Health — `/health`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness → `{data:{status,uptimeSeconds}}` |
| GET | `/health/ready` | – | Readiness (pings DB) → 200 / 503 |

### 8.2 Auth — `/auth`
| Method | Path | Auth | Body → Result |
|---|---|---|---|
| POST | `/auth/login` | public | `{email,password}` → 200 `{data:{accessToken,user}}` + refresh cookie; 401 |
| POST | `/auth/refresh` | refresh cookie | → 200 `{data:{accessToken,user}}`; 401 |
| POST | `/auth/logout` | public | → 204 (revokes refresh token via token_version, clears cookie) |
| GET | `/auth/me` | Bearer | → 200 `{data: AuthUser}` |
| POST | `/auth/forgot-password` | public (rate-limited) | `{email}` → 200 always (dev also returns `resetToken`) |
| POST | `/auth/reset-password` | public | `{token,newPassword}` → 204; 400 on invalid/expired/used token |

### 8.3 Departments — `/departments`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/departments` | any | `?page,limit,sort,search` → Paginated`<DepartmentDTO>` |
| GET | `/departments/:id` | any | 200 / 404 |
| POST | `/departments` | admin, hr | `CreateDepartmentRequest` → 201; 409 dup name; 400 bad headId |
| PATCH | `/departments/:id` | admin, hr | `UpdateDepartmentRequest` → 200; 404; 409; 400 |
| DELETE | `/departments/:id` | admin | 204; 409 if employees still assigned |

### 8.4 Employees — `/employees`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/employees` | any | `?page,limit,sort,search,departmentId,status,managerId` |
| GET | `/employees/:id` | any | 200 / 404 |
| POST | `/employees` | admin, hr | `CreateEmployeeRequest` → 201 (creates user+employee txn); 409 dup email; 400 bad FK; **403 if hr grants admin/hr** |
| PATCH | `/employees/:id` | admin, hr | `UpdateEmployeeRequest` → 200 |
| DELETE | `/employees/:id` | admin | 204 (deletes user → cascade); 409 if PM of a project |

### 8.5 Projects — `/projects`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/projects` | any | `?page,limit,sort,search,status,priority,departmentId,managerId` |
| GET | `/projects/:id` | any | 200 / 404 |
| POST | `/projects` | admin, manager | `CreateProjectRequest` → 201; 409 dup code; 400 dates/FK |
| PATCH | `/projects/:id` | admin, manager | `UpdateProjectRequest` → 200 |
| DELETE | `/projects/:id` | admin, manager | 204 (cascades tasks + members) |
| GET | `/projects/:id/members` | any | 200 `{data: ProjectMemberDTO[]}` |
| POST | `/projects/:id/members` | admin, manager | `{employeeId, roleOnProject?}` → 201; 409 dup |
| DELETE | `/projects/:id/members/:employeeId` | admin, manager | 204 |

### 8.6 Tasks — `/tasks`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/tasks` | any | `?page,limit,sort,search,projectId,assigneeId,status,priority` |
| GET | `/tasks/:id` | any | 200 / 404 |
| POST | `/tasks` | admin, manager | `CreateTaskRequest` → 201; 400 bad FK |
| PATCH | `/tasks/:id` | admin, manager | `UpdateTaskRequest` → 200 |
| PATCH | `/tasks/:id/status` | admin/manager **or** assignee/reporter | `{status}` → 200; **403** otherwise |
| DELETE | `/tasks/:id` | admin, manager | 204 |
| GET | `/tasks/:id/comments` | any | 200 `{data: CommentDTO[]}` |
| POST | `/tasks/:id/comments` | any | `{body}` → 201 |
| PATCH | `/tasks/:id/comments/:commentId` | author or admin | `{body}` → 200; 403 |
| DELETE | `/tasks/:id/comments/:commentId` | author or admin | 204; 403 |

### 8.7 Leave — `/leave-requests`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/leave-requests` | any | Employees see own; admin/hr/manager see all. `?page,limit,sort,status,type` |
| POST | `/leave-requests` | any | `CreateLeaveRequest` → 201; 400 bad dates |
| PATCH | `/leave-requests/:id/approve` | admin, hr, manager (not self) | 200; 403 self; 409 not pending; 404 |
| PATCH | `/leave-requests/:id/reject` | admin, hr, manager (not self) | 200; 403; 409; 404 |
| PATCH | `/leave-requests/:id/cancel` | owner | 200; 403; 409; 404 |

### 8.8 Attendance — `/attendance`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/attendance/check-in` | any | `{status?,notes?}` → 201; 409 already checked in today |
| POST | `/attendance/check-out` | any | → 200; 409 no open check-in |
| GET | `/attendance/today` | any | → 200 `{data: AttendanceDTO \| null}` |
| GET | `/attendance/me` | any | `?page,limit,from,to` → Paginated |
| GET | `/attendance` | admin, hr, manager | `?page,limit,employeeId,from,to` → Paginated |

### 8.9 Notifications — `/notifications` (all scoped to current user)
| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | `?page,limit,unreadOnly` → Paginated`<NotificationDTO>` |
| GET | `/notifications/unread-count` | `{data:{count}}` |
| PATCH | `/notifications/read-all` | 204 |
| PATCH | `/notifications/:id/read` | 204 |
| DELETE | `/notifications/:id` | 204; 404 |

### 8.10 Reports — `/reports` (admin, hr, manager)
| Method | Path | Result |
|---|---|---|
| GET | `/reports/attendance-summary?from&to` | `{data: AttendanceSummaryDTO}` |
| GET | `/reports/leave-summary?from&to` | `{data: LeaveSummaryDTO}` (overlap semantics) |
| GET | `/reports/project-status` | `{data: ProjectStatusSummaryDTO}` |
| GET | `/reports/headcount` | `{data: HeadcountSummaryDTO}` |

### 8.11 Profile — `/profile` (current user)
| Method | Path | Notes |
|---|---|---|
| GET | `/profile` | `{data: EmployeeDTO}` |
| PATCH | `/profile` | `{phone?,dateOfBirth?,avatarUrl?}` → `{data: EmployeeDTO}` |
| PATCH | `/profile/password` | `{currentPassword,newPassword}` → 204; 400 wrong current (revokes sessions) |
| POST | `/profile/avatar` | Upload avatar (`multipart/form-data`, field `avatar`) → 200; 400 bad type/size |

### 8.12 Settings — `/settings` (current user)
| Method | Path | Notes |
|---|---|---|
| GET | `/settings` | `{data: UserSettingsDTO}` (creates default on first access) |
| PATCH | `/settings` | `{theme?,locale?,emailNotifications?,inAppNotifications?}` |

### 8.13 Dashboard — `/dashboard`
| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard/summary` | Role-aware BFF aggregation → `{data: DashboardSummaryDTO}` |

---

## 9. Shared Type Contract

Located in `shared/src`. Both client and server import from `@ems/shared`.

### 9.1 Enums (string unions)
`RoleName`, `EmploymentStatus`, `ProjectStatus`, `TaskStatus`, `PriorityLevel`,
`AttendanceStatus`, `LeaveType`, `LeaveStatus`, `NotificationType` — values match §5.2.

### 9.2 Envelope & error types (`types/api.ts`)
`ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`, `ApiErrorCode`, `FieldError`,
`ApiErrorBody`, `ListQuery`.

### 9.3 Key DTOs
- **auth:** `AuthUser { id, email, role, isActive, employee: {id,firstName,lastName,avatarUrl?} | null }`,
  `LoginRequest`, `LoginResponse { accessToken, user }`, `ChangePasswordRequest`.
- **domain:** `EmployeeSummary { id, employeeCode, firstName, lastName, jobTitle?, avatarUrl? }`,
  `DepartmentSummary { id, name }`.
- **department:** `DepartmentDTO { id, name, description?, head: EmployeeSummary|null, employeeCount,
  createdAt, updatedAt }`, `CreateDepartmentRequest`, `UpdateDepartmentRequest`.
- **employee:** `EmployeeDTO` (extends EmployeeSummary + email, role, status, phone?, hireDate,
  dateOfBirth?, isActive, department, manager, timestamps), `CreateEmployeeRequest`
  (email, password, roleName, names, jobTitle?, departmentId?, managerId?, hireDate, phone?,
  dateOfBirth?), `UpdateEmployeeRequest`.
- **project:** `ProjectDTO` (code, name, status, priority, department, projectManager, dates,
  budget?, memberCount, taskCount), `ProjectMemberDTO { employee, roleOnProject?, allocatedAt }`,
  `CreateProjectRequest`, `UpdateProjectRequest`, `AddProjectMemberRequest`.
- **task:** `TaskDTO` (projectId, parentTaskId, title, status, priority, dueDate?, estimatedHours?,
  assignee, reporter, commentCount), `CommentDTO`, `CreateTaskRequest`, `UpdateTaskRequest`,
  `UpdateTaskStatusRequest`, `CreateCommentRequest`.
- **leave:** `LeaveRequestDTO` (type, status, dates, reason?, employee, approver, decidedAt?),
  `CreateLeaveRequest`.
- **attendance:** `AttendanceDTO` (employeeId, workDate, checkInAt?, checkOutAt?, status, notes?,
  employee), `CheckInRequest`.
- **notification:** `NotificationDTO`, `UnreadCountDTO`.
- **report:** `CountByKey { key, count }`, `AttendanceSummaryDTO`, `LeaveSummaryDTO`,
  `ProjectStatusSummaryDTO`, `HeadcountSummaryDTO`.
- **settings:** `ThemePreference`, `UserSettingsDTO`, `UpdateSettingsRequest`, `ChangePasswordRequestBody`.
- **dashboard:** `DashboardSummaryDTO { myOpenTasks, myPendingLeave, todayAttendanceStatus,
  teamStats?, projectStats?, recentNotifications }`.

---

## 10. Frontend Architecture

### 10.1 Bootstrap & providers
`main.tsx` mounts `<App/>` in `StrictMode`. `App` = `<AppProviders><AppRouter/></AppProviders>`.
`AppProviders` composition (outer → inner): `ThemeProvider` + `CssBaseline` → `ErrorBoundary` →
`BrowserRouter` → `AuthProvider` → `SnackbarProvider` → `NotificationsBadgeProvider`.

### 10.2 Routing (`app/router`)
- `AppRouter` — lazy-loaded pages (`React.lazy` + `Suspense` → per-route code splitting).
  Public `/login` under `AuthLayout`; protected routes under `ProtectedRoute` → `AppLayout`.
  `/reports` additionally wrapped in `RoleRoute allow={admin,hr,manager}`.
- `ProtectedRoute` — 3-state guard: `initializing` → `PageLoader`; `unauthenticated` → redirect to
  `/login` (remembering intended location); `authenticated` → `<Outlet/>`.
- `RoleRoute` — redirects users whose role isn't allowed to the dashboard.

### 10.3 Contexts
- **AuthContext** — `useReducer` state machine (`initializing → authenticated/unauthenticated`),
  bootstraps via `/auth/refresh` on mount, exposes `status/user/isAuthenticated/login/logout`.
  Registers `onSessionExpired` so a failed refresh forces logout. Value memoized; callbacks stable.
- **SnackbarContext** — global toast; exposes `notify(message, severity)`.
- **NotificationsBadgeProvider** — shared unread count for the bell + notifications page; polls
  every 45s (only when authenticated) and exposes `refresh()` for instant updates after mutations.

### 10.4 HTTP layer (`lib/http/client.ts`)
Single Axios instance (`baseURL = VITE_API_URL`, `withCredentials: true`). Request interceptor
attaches the in-memory access token (NOT localStorage). Response interceptor normalizes every
error to `NormalizedError { status, code, message, details? }` and implements **401 →
refresh-and-retry** (single-flight + queue). `setAccessToken()` / `onSessionExpired()` are exposed.

### 10.5 Theme (`theme/index.ts`)
MUI `createTheme` — palette (primary #1565c0, secondary #00838f), typography (Inter, no-uppercase
buttons), shape (radius 8), component defaults (Button disableElevation, AppBar bordered, etc.).

### 10.6 Shared design system (`components/`)
- **ui/Button** — MUI Button + `loading` prop (spinner + disabled).
- **ui/DataTable`<T>`** — generic table: columns config with `render`, skeleton loading rows,
  EmptyState/ErrorState integration, MUI TablePagination (controlled, 1-based), optional
  `rowActions`. Presentational only.
- **ui/SearchBar** — debounced input (via `useDebounce`), calls `onSearch` after a pause.
- **feedback/** — `EmptyState`, `ErrorState` (+ retry), `PageLoader` (Suspense fallback),
  `ConfirmDialog` (destructive-action confirmation with async `loading`).
- **layout/PageHeader** — title + subtitle + right-aligned action slot.

### 10.7 Shared hooks (`hooks/`)
- **useDebounce(value, delay)** — debounced value.
- **useDisclosure(initial)** — `{ isOpen, open, close, toggle }`.

### 10.8 Feature structure
Each feature = `api/` (typed Axios wrappers), `hooks/` (data-fetching + options hooks),
`components/` (feature-private), `pages/`, `validation.ts` (zod form schemas), `index.ts` (public
barrel). Cross-feature use goes through barrels only (e.g. employees imports `useDepartmentOptions`
from `../../departments`).

**Data-fetching hook pattern** (list screens): owns `page/limit/search + filters + data/loading/
error`, `useCallback` fetch keyed on deps, `useEffect` with an **`isActive` stale-response guard**,
`useMemo` return, `refetch`. Changing search/filter/limit resets to page 1.

### 10.9 Realtime client — `lib/realtime/`
- **`socket.ts`** — a single app-wide `WebSocket` to `/ws` (URL derived from `VITE_API_URL`'s
  host, authenticated with the in-memory access token). Auto-reconnects with a 3s backoff.
  Exposes `connectRealtime()`, `disconnectRealtime()`, and `onRealtime(handler)` which delivers a
  typed `RealtimeMessage` (`connected | notification | task_updated`) and returns an unsubscribe.
- **`RealtimeProvider`** — connects while `status === 'authenticated'`, disconnects on logout
  (rendered inside `AuthProvider`).
- **Consumers:** `NotificationsBadgeProvider` increments the unread badge instantly on a
  `notification` event (the 45s poll is now a fallback); `NotificationsPage` refetches the feed;
  `TasksPage` refetches the table on `task_updated`.

---

## 11. Module Reference

Each module below is backend (layered) + frontend (feature). Backend routes/DTOs are in §8/§9.

| Module | Backend highlights | Frontend highlights |
|---|---|---|
| **Auth** | login/refresh/logout/me; JWT dual-token; bcrypt; uniform login error | LoginPage (RHF+zod), session bootstrap, 401-retry interceptor |
| **Dashboard** | BFF `dashboard.service` aggregates tasks/leave/attendance/projects + recent notifications (role-aware) | Live StatCards + recent notifications |
| **Departments** | CRUD; unique name → 409; FK (employees) delete → 409; bad headId → 400 | DataTable, form dialog, search, page-clamp on delete |
| **Employees** | Transactional user+employee create (`createWithUser`), employee_code sequence, cascade delete, FK translation, role-assignment guard | Avatar+code cells, StatusChip, dept/status filters, dual-mode form (select dropdowns) |
| **Projects** | CRUD + M:N members (add/list/remove); enum-cast INSERT; budget::float8 | Form with dept/PM/status/priority selects, status/priority chips + filters |
| **Tasks** | CRUD + status action (scoped authz) + comments (author-or-admin); user→employee resolution for authorship | Table with project/status filters, TaskStatusChip, form (project/assignee selects) |
| **Leave** | State machine apply→approve/reject/cancel; own-vs-all listing; self-approval blocked; CHECK date → 400; emits notification on decision | Apply dialog + approvals inbox (approve/reject/cancel row actions), status chips |
| **Attendance** | check-in/out (once-per-day UNIQUE → 409), today, me, all (admin/hr/manager) | Today card with check-in/out + records table (mine or all) |
| **Notifications** | Per-user feed, unread-count, read/read-all/dismiss; created as a side-effect by leave decisions | Feed page (mark-read/dismiss/mark-all + unread filter) + topbar bell w/ shared badge |
| **Reports** | SQL GROUP BY aggregates (headcount, project-status, leave, attendance); overlap date logic | Report cards with proportional bar visualizations (no chart lib) |
| **Profile** | GET/PATCH own profile (narrow fields) + change-password (verify current) | Profile view + edit form + change-password form |
| **Settings** | GET/PATCH user_settings (upsert default) | Theme/locale selects + notification toggles |

---

## 12. Cross-Cutting Patterns

**Backend CRUD template** (departments/employees/projects/tasks all follow):
`routes` (authenticate + per-route authorize + validate) → `controller` (parseWith for query,
`satisfies ApiResponse<T>`) → `service` (row→DTO, existence checks, DB-error → HTTP-error
translation) → `repository` (paginated list with whitelisted sort + ILIKE search, parallel
list+count queries, partial dynamic UPDATE, `COUNT(*)::int`).

**Frontend list-screen template:** `feature/api` → `useX` data hook (with `isActive` guard) →
Page composes `PageHeader + SearchBar + filters + DataTable + FormDialog + ConfirmDialog`, using
`useDisclosure` (dialogs), `useSnackbar` (toasts), and role gating that mirrors the backend.

**Notable engineering notes:**
- Enum columns with an INSERT default require an explicit cast:
  `COALESCE($n::project_status, 'planning')` — a plain `COALESCE($n,'planning')` yields `text` and
  won't assign to an enum column. (`UPDATE SET col=$n` works via column-context inference.)
- `DATE` columns are cast `::text` in SELECTs to avoid JS `Date`/timezone drift.
- `parseWith` uses `<S extends ZodType>(…): z.infer<S>` to preserve zod's separate input/output
  types (so `.default()`/`.coerce` fields resolve correctly).

---

## 13. Adversarial Security Review — Findings & Remediation

A 5-dimension multi-agent review (security/authz, SQL/data-integrity, service-logic, client-data,
client-react) produced findings that were each **independently verified** against the code (skeptic
defaults to false-positive). 13 confirmed; 1 false-positive filtered. Status below.

### Fixed & re-verified against real PostgreSQL
| # | Sev | Finding | Remediation |
|---|---|---|---|
| 1 | High | HR could create `admin`/`hr` accounts (privilege escalation) | `employees.service.create(input, creatorRole)` — only admin may grant admin/hr, else `ForbiddenError` (→ 403 verified) |
| 2 | Med | `PATCH /tasks/:id/status` had no authorization | Now requires admin/manager **or** the task's assignee/reporter (→ 403 verified) |
| 3 | Med | Leave approver could approve/reject their own request | `decideOrThrow` blocks when `approverId === requester` (→ 403 verified) |
| 4 | Med | Leave reports used "fully-contained" date logic, dropping boundary-crossing leaves | Switched to overlap: `end_date >= from AND start_date <= to` |
| 5 | Med | Bad department `headId` (FK violation) returned 500 | `departments.service` translates FK → `ValidationError` (→ 400 verified) |
| 6 | Med | List hooks had a stale-response race (out-of-order fetches clobber state) | Added `isActive` guard to all 7 list hooks |
| 7 | Med | Deleting the last row on page > 1 stranded an empty page | `handleDelete` clamps the page in all 4 CRUD pages |
| 8 | Low | `/reports` route wasn't role-guarded; unread bell went stale after actions | `RoleRoute` guards `/reports`; `NotificationsBadgeProvider` shares the count + refreshes on mutation |

### Documented / deferred (deliberate, low severity)
- **Stateless refresh tokens** — logout and password change don't revoke existing tokens; the
  correct fix is a `token_version` column checked on refresh and bumped on logout/password-change.
- **RHF `field.ref` on MUI root** — focus-on-validation-error is a no-op; fix is
  `inputRef={field.ref}` in each `Controller`.
- **Relationship dropdowns cap at 100** — an already-selected value outside the first 100 renders
  blank in edit mode; needs an async/searchable autocomplete for very large orgs.

> All three deferred items above were subsequently implemented (token_version revocation,
> `FormTextField`/`FormAutocomplete`). A **second** adversarial review then ran over that new code —
> see below.

### Second review round — new code (auth hardening, uploads, realtime, forms)

A 3-dimension review (auth-security, server-logic, frontend) over the newly-added code, each finding
**independently verified** (19 agents total; skeptic defaults to false-positive). **12 confirmed**
(4 false-positives filtered). **11 fixed; 1 accepted with rationale.**

| # | Sev | Finding | Remediation |
|---|-----|---------|-------------|
| 1 | High | Login rate-limit bypass — bucket keyed on raw, unvalidated email, so whitespace/case variants of one account each got a fresh allowance | Normalize the key (`trim` + `toLowerCase`, length-capped) in `rateLimit` so all variants of one identity share a bucket (regression test added) |
| 2 | High | Avatar upload stored-XSS — stored extension copied from attacker-controlled `originalname`; `image/png` + `filename=x.html` persisted as `.html` and served as active content | Extension now derived from a **validated mimetype→ext allowlist** (SVG excluded); `/uploads` served with `nosniff` + `Content-Disposition: attachment` + `default-src 'none'` CSP |
| 3 | High | SIGTERM graceful shutdown deadlocked with any live WS client (upgraded sockets block `server.close`'s callback → forced exit 1, DB pool never drained) | `closeRealtime()` now `terminate()`s all clients; `shutdown()` closes realtime first, then `server.close` + `closeIdleConnections()` (drops idle keep-alives only, lets in-flight requests finish), with a guard against double-signal |
| 4 | Med | Global CSP disabled removed the main defense against uploaded-file XSS | Strict `Content-Security-Policy` now set on every response **except** `/api/docs` (which needs Swagger's inline assets) |
| 5 | Med | Rate limiter's unvalidated-key Map could grow unboundedly (memory DoS) | Same normalization + a hard `MAX_BUCKETS` cap with oldest-entry eviction |
| 6 | Med | WS authenticated only once at connect; an expired/revoked token kept its socket authorized indefinitely | Socket lifetime bounded to the access-token `exp` (auto-close → client reconnects with a fresh/again-validated token); token `type === 'access'` asserted |
| 7 | Med | Client socket `onclose/onerror` didn't identify the current instance → orphaned duplicate connections double-counting notifications | Capture the instance; `onclose/onerror` no-op unless `socket === ws` |
| 8 | Med | `ProjectMembersDialog` load had no cancellation guard → a stale project's members could win | Effect passes an `isActive()` guard into `load()` (matches the `TaskCommentsDialog` pattern) |
| 9 | Low | Login timing side-channel enabled email enumeration (bcrypt skipped on the not-found path) | Always run bcrypt — real hash if the user exists, else a lazily-computed dummy hash — so all paths take constant time (integration test added) |
| 10 | Low | `TaskCommentsDialog` optimistic add could be clobbered by the in-flight initial load | Composer disabled while `loading`, so a post can't race the initial fetch |
| 11 | Low | Theme "live preview" persisted to `localStorage` immediately, so an unsaved change survived reload | `ColorModeProvider` split into `previewMode` (apply-only) vs `setMode` (persist); `SettingsPage` reverts an unsaved preview on unmount |

**Accepted (with rationale):** *WS access token in the `?token=` query string* (low/hygiene) — the
browser WebSocket API cannot set handshake headers, so this is the standard fallback. Documented in
code; the hardening path (one-time REST-minted ticket, or `Sec-WebSocket-Protocol`) is noted but out
of scope for this project.

**False-positives filtered:** `emitToAll` "leaks across projects" (payload is a non-sensitive
"refresh" signal), WS not asserting token type (separate secrets already prevent cross-use — hardened
anyway in #6), heartbeat pinging non-OPEN sockets (`ws@8` no-ops), and access tokens outliving a
`token_version` bump (by design — revocation lives on refresh).

#### Fix-verification round (the fixes were themselves re-reviewed)

All 11 fixes above were then **independently re-reviewed** (one adversarial verifier per fix + a
cross-cutting regression/interaction critic). **10 were confirmed solid; 1 real regression was caught
and corrected:** the shutdown fix had used `server.closeAllConnections()`, which also aborts *in-flight*
requests on every deploy — replaced with `server.closeIdleConnections()` (row #3), which only drops
idle keep-alive sockets and lets active requests finish (the watchdog remains the backstop). The critic
found no un-updated callsites or bad interactions between fixes.

The security-critical fixes were additionally **live-E2E'd against a real server** (throwaway
`ems_review` DB, booted server): strict CSP present app-wide and absent on `/api/docs`; login
correct→200+token+`HttpOnly` refresh cookie / wrong→401 / unknown→401; an avatar uploaded as
`image/png` with `filename=evil.html` was stored as `.png` and served `image/png` with
`nosniff`+`attachment`+`default-src 'none'`; 12 whitespace/case variants of one email shared **one**
rate-limit bucket (429 at the 11th); WS accepted a valid token and rejected an invalid one (1008). The
graceful-shutdown fix — not signal-testable on Windows — is covered by an integration test that
`terminate()`s a live authenticated client and asserts the HTTP server then closes without deadlock.

---

## 14. Verification & Testing

Every backend module was **exercised end-to-end against a real PostgreSQL database** (a throwaway
`ems_verify` DB is created, migrated, seeded, the compiled server booted, endpoints probed, then
the DB dropped). Verified behaviors include:

- Auth: login → me → refresh → wrong-password (401) → logout; refresh-cookie path scoping.
- Employees: transactional create (then logging in as the new employee), cascade delete (login →
  401), department-head assignment, duplicate email (409), bad FK (400).
- Departments/Projects/Tasks: full CRUD + conflict/validation/404 paths; M:N members; task status
  action; comments (author resolution + author-gated edits).
- Leave: apply → approve/reject/cancel state machine, 409 on illegal transitions, self-approval 403.
- Attendance: check-in/out, once-per-day 409, no-open-checkout 409.
- Notifications: feed + read/dismiss, leave-decision side-effect, per-user scoping.
- Reports/Profile/Settings/Dashboard: aggregates, change-password validation, role-aware summary.
- **Security fixes** (§13 #1,2,3,5): re-verified live (403/400 as expected).

The client is type-checked (`tsc --noEmit`) and **production-built** (`vite build`) after every
change. There is now an automated **Vitest** suite as well — **18 server tests** (jwt/password,
`parseWith`/pagination/`pgErrorCode`, rate-limit incl. the bypass regression, a mocked-repository
`login()` integration test covering all four auth paths, and a `closeRealtime` shutdown integration
test that proves a live WS client is terminated so the HTTP server closes without deadlock) and
**4 client component tests** — run via `npm test` in each package and gated in CI, alongside the
compilation + live E2E probing above.

---

## 15. Build, Run & Scripts

### Prerequisites
- Node.js ≥ 20 (`.nvmrc` → 22)
- A running PostgreSQL (the dev DB is named `ems`)

### First-time setup
```bash
# install (each package has its own node_modules)
npm install
npm install --prefix shared
npm install --prefix server
npm install --prefix client

# configure the server
cp server/.env.example server/.env
#   → set DATABASE_URL, e.g. postgres://postgres:<password>@localhost:5432/ems
#   → set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (≥16 chars each)

# configure the client
cp client/.env.example client/.env      # VITE_API_URL defaults to http://localhost:4000/api/v1

# create + initialize the database
createdb -U postgres ems                 # or via psql / pgAdmin
npm run migrate                           # applies all migrations
npm run seed                              # creates the admin user

# run everything
npm run dev                               # server :4000 + client :5173
```

### Key scripts
| Location | Script | Action |
|---|---|---|
| root | `dev` | server + client concurrently |
| root | `build` | shared → server → client |
| root | `migrate` / `typecheck` / `lint` / `format` | delegate to sub-packages |
| server | `dev` | `tsx watch src/index.ts` |
| server | `build` / `start` | `tsc` → `dist`, then `node dist/index.js` |
| server | `migrate` / `seed` | `tsx src/db/{migrate,seed}.ts` |
| server | `typecheck` | `tsc --noEmit` |
| client | `dev` / `build` / `preview` / `typecheck` | Vite + `tsc --noEmit` |
| shared | `build` | `tsc` → `dist` (also runs on `prepare`) |

### Environment variables (`server/.env`)
`NODE_ENV`, `PORT` (4000), `DATABASE_URL`, `PG_POOL_MAX` (10), `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL` (15m), `JWT_REFRESH_TTL` (7d), `BCRYPT_ROUNDS` (12),
`CORS_ORIGIN` (http://localhost:5173), `PUBLIC_URL` (http://localhost:4000, for served uploads),
`LOG_LEVEL` (info). Client (`client/.env`): `VITE_API_URL`.

### Testing & Docker
```bash
npm test                     # Vitest: server units + client components (16 tests)
docker compose up --build    # full stack; client :8080, API :4000, docs :4000/api/docs
```
CI runs typecheck → lint → test → build on push/PR (`.github/workflows/ci.yml`). Interactive API
docs (Swagger UI) are served at **`/api/docs`**.

---

## 16. Delivered Enhancements & Remaining Work

**Delivered (post-initial-build hardening & features):**
- ✅ **Realtime WebSockets** (`/ws`) — live notifications + task-board refresh (§6.8, §10.9).
- ✅ **Refresh-token revocation** via `token_version` (logout / password change / reset).
- ✅ **Login + forgot-password rate limiting** (in-memory fixed-window, 429).
- ✅ **Forgot/reset password** — endpoints (`/auth/forgot-password`, `/auth/reset-password`) with
  sha256-hashed, single-use, 1-hour tokens + no enumeration; and the `ForgotPassword`/`ResetPassword`
  pages.
- ✅ **Avatar upload** — `POST /profile/avatar` (multer, image/2 MB), served from `/uploads`, with a
  "Change photo" control on the profile page.
- ✅ **Theme (light/dark/system)** — `ColorModeProvider` applies the saved preference to MUI;
  Settings toggles it live and persists it.
- ✅ **Task comments UI** — a comments dialog per task (view + add), with live count.
- ✅ **Project members UI** — a members dialog with a searchable employee picker (add/remove).
- ✅ **Searchable pickers + form fix** — reusable `FormTextField` (correct `inputRef`) and
  `FormAutocomplete` (searchable, injects the current selection); all form dialogs migrated.
- ✅ **Automated tests** — Vitest: server unit tests (jwt, password, validation, pagination, errors,
  rate limiter) + client component tests (Button, EmptyState, StatusChip). `npm test`.
- ✅ **Docker** — `Dockerfile`s for server (Node) and client (nginx) + `docker-compose.yml`
  (Postgres + server + client, auto-migrate/seed). `docker compose up --build`.
- ✅ **CI** — `.github/workflows/ci.yml` runs install → typecheck → lint → test → build.
- ✅ **OpenAPI + Swagger UI** — `server/openapi.yaml` served at **`/api/docs`**.
- ✅ **Rules of Hooks** enforced via `eslint-plugin-react-hooks`.

**Remaining (nice-to-have / genuinely deferred):**
- Email delivery for password reset (currently the dev token is returned/logged; wire an SMTP/email
  provider for production).
- Object storage for avatars (currently local disk; swap for S3 in production).
- Cursor pagination for the notifications *feed* history (live delivery already works via WS).
- Server-side searchable option loading for very large orgs (pickers are searchable but still load
  up to 100 options client-side; the current selection is always injected so nothing renders blank).
- Broader integration test coverage (a DB-backed supertest suite) and the `parent_task_id`
  subtasks UI.

---

## 17. Appendix

### Seed credentials (development)
- **admin@ems.local** / **Admin@12345** (role: admin, employee `EMP-00001`).
  Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### Ports
- Server API: `http://localhost:4000` (base `/api/v1`)
- Client dev: `http://localhost:5173`

### Conventions
- Roles: `admin`, `hr`, `manager`, `employee`.
- Employee codes: `EMP-#####` (admin `EMP-00001`, API-created from `EMP-00002`).
- All PKs UUID; all timestamps TIMESTAMPTZ (UTC); DATE fields serialized as `YYYY-MM-DD`.
- API error `code` is machine-readable and stable; `message` is human-facing.
- Feature isolation: import a feature via its `index.ts` barrel, never its internals.

---

*Generated as the technical reference for the Enterprise Employee & Project Management System.*
