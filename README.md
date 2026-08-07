# Enterprise Employee & Project Management System (EMS)

A production-style, full-stack enterprise app — authentication & RBAC, employees, departments,
projects, tasks, leave, attendance, notifications, reports, and a role-aware dashboard — built as a
mentored exercise in advanced React and clean backend architecture.

**Modules:** Auth · Dashboard · Departments · Employees · Projects · Tasks · Leave · Attendance ·
Notifications · Reports · Profile · Settings.

## Tech stack

| Layer | Choices |
|---|---|
| **Frontend** | React 18 · TypeScript · Material UI · React Router · Axios · Vite |
| **Backend** | Node.js · Express · PostgreSQL · JWT (access + refresh) · WebSockets (`ws`) |
| **Shared** | Isomorphic TypeScript types — the API contract, imported by both sides |
| **Tooling** | npm (no workspaces) · ESLint · Prettier · Vitest · Docker · GitHub Actions |

## Repository layout

```
.
├─ client/   # React + TypeScript + MUI single-page app (Vite)
├─ server/   # Express + TypeScript + PostgreSQL API (+ /ws realtime, Swagger docs)
├─ shared/   # Isomorphic TypeScript types = the API contract (imported by client and server)
├─ docs/     # TECHNICAL_DOCUMENTATION.md — the deep-dive reference
└─ package.json  # root: orchestration scripts + shared lint/format tooling only
```

Each package keeps its **own** `node_modules` (this is a plain monorepo, not npm workspaces).
`shared` is linked into `server`/`client` via `file:../shared`.

---

## Quick start

### Option A — Docker Compose (fastest; only Docker required)

```bash
docker compose up --build
```

This starts Postgres, the API, and the client, then **auto-migrates and seeds** the database:

| Service | URL |
|---|---|
| Web app | http://localhost:8080 |
| API | http://localhost:4000/api/v1 |
| API docs (Swagger) | http://localhost:4000/api/docs |

> The compose file ships throwaway JWT secrets for local use — change them before any real deployment.

### Option B — Local development

**Prerequisites:** Node.js `>= 20` (`.nvmrc` → 22), a running **PostgreSQL** instance, and npm.

```bash
# 1. Install dependencies for each package (no workspaces → install per package)
npm install                    # root tooling (eslint, prettier, concurrently)
npm install --prefix shared
npm install --prefix server
npm install --prefix client

# 2. Build the shared type contract once (server/client dev rebuild it automatically thereafter)
npm run build:shared

# 3. Configure environment
cp server/.env.example server/.env     # set DATABASE_URL + JWT secrets (see table below)
cp client/.env.example client/.env     # optional — the default points at http://localhost:4000

# 4. Create the database, then apply migrations + seed the admin user
createdb ems                           # or create "ems" via psql / pgAdmin
npm run migrate                        # applies server/db/migrations/*.sql transactionally
npm --prefix server run seed           # creates the default admin (idempotent)

# 5. Run the full stack (API on :4000, client on :5173) in watch mode
npm run dev
```

Then open the client at **http://localhost:5173**. The API is at `http://localhost:4000/api/v1`
and interactive docs at `http://localhost:4000/api/docs`.

### Default login

```
Email:    admin@ems.local
Password: Admin@12345
```

Override the seeded credentials with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before running the seed.

---

## Environment variables

**`server/.env`** (copy from `server/.env.example`):

| Variable | Purpose | Example / default |
|---|---|---|
| `NODE_ENV` | Runtime mode | `development` |
| `PORT` | API port | `4000` |
| `DATABASE_URL` | Postgres connection string | `postgres://postgres:postgres@localhost:5432/ems` |
| `JWT_ACCESS_SECRET` | Access-token secret (≥16 chars) | *(set your own)* |
| `JWT_REFRESH_SECRET` | Refresh-token secret (≥16 chars, different) | *(set your own)* |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Token lifetimes | `15m` / `7d` |
| `BCRYPT_ROUNDS` | Password hashing cost | `12` |
| `CORS_ORIGIN` | Allowed browser origin | `http://localhost:5173` |
| `PUBLIC_URL` | Base URL used to build links to uploaded avatars | `http://localhost:4000` |
| `LOG_LEVEL` | Pino log level | `info` |

**`client/.env`** (copy from `client/.env.example`):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:4000/api/v1` |

---

## Scripts (run from the repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Start **API (:4000) + client (:5173)** together in watch mode |
| `npm run build` | Build `shared` → compile `server` → bundle `client` |
| `npm run build:shared` | Build only the shared type contract |
| `npm run migrate` | Apply pending SQL migrations (transactional) |
| `npm run typecheck` | Type-check server + client (no emit) |
| `npm run test` | Run the server (Vitest) and client (Vitest + jsdom) suites |
| `npm run lint` | ESLint over the whole repo |
| `npm run format` | Format with Prettier |

Package-specific extras: `npm --prefix server run seed` (seed the admin user),
`npm --prefix server run start` (run the compiled API), `npm --prefix client run preview`
(serve the production client build).

---

## Testing

```bash
npm run test          # server + client
npm --prefix server run test    # server only (Vitest)
npm --prefix client run test    # client only (Vitest + jsdom + Testing Library)
```

The suite covers the security-critical business rules with mocked-repository unit tests (auth
login/refresh/logout/reset, privilege-escalation guard, task/comment authorization, leave
self-approval + state machine, attendance state machine, notification scoping), plus client hook
and component tests. Backend modules are additionally exercised end-to-end against a real Postgres
database during development.

## API documentation & realtime

- **Swagger UI** is served at `/api/docs`; the OpenAPI spec lives at `server/openapi.yaml`.
- A JWT-authenticated **WebSocket** endpoint at `/ws` pushes live notifications and task-board
  updates. The REST API remains the source of truth; WS messages are "something changed" signals.

## Architecture (in brief)

- **Backend** — feature-based `modules/*`, each layered `route → controller → service →
  repository`. SQL lives only in repositories; a single central error handler translates typed
  `AppError`s into the `{ error: { code, message, details } }` contract.
- **Frontend** — feature-based `features/*` with public-API barrels, a shared `components/` design
  system (generic `DataTable`, form controls, dialogs), Context + hooks for state, and lazy-loaded
  routes.
- **Contract** — every request/response type lives in `shared/` and is imported by both sides, so
  the TypeScript compiler catches any drift between client and server.

For the full design — data model, auth flows, security hardening, and review history — see
[`docs/TECHNICAL_DOCUMENTATION.md`](docs/TECHNICAL_DOCUMENTATION.md).

## Continuous integration

`.github/workflows/ci.yml` runs **typecheck → lint → test → build** on every push.
