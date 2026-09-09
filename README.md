# Enterprise Employee & Project Management System (EMS)

A production-style, full-stack enterprise app — authentication & RBAC, employees, departments,
projects, tasks, leave, attendance, notifications, reports, peer chat, and a role-aware dashboard.

Built as a mentored exercise in advanced React, clean backend architecture, and modern UI patterns
(virtualized feeds, realtime messaging, employee QR cards).

**Core modules:** Auth · Dashboard · Departments · Employees · Projects · Tasks · Leave ·
Attendance · Notifications · Reports · Profile · Settings · **Chat**

**POC highlights:** TanStack Virtual employee feed · Instagram-style infinite scroll · per-employee
QR codes · realtime peer chat over WebSockets

## Tech stack

| Layer | Choices |
|---|---|
| **Frontend** | React 18 · TypeScript · Material UI · React Router · Axios · Vite · TanStack Virtual |
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

Each package keeps its **own** `node_modules` (plain monorepo, not npm workspaces).
`shared` is linked into `server`/`client` via `file:../shared`.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js** `>= 20` | `.nvmrc` pins `22` — use `nvm use` if you have nvm |
| **npm** | Comes with Node |
| **PostgreSQL** `14+` | Required for local dev (Docker option bundles Postgres) |
| **Docker + Compose** | Optional but recommended for the fastest first run |

---

## Quick start (recommended: Docker)

The simplest way to run everything with no local Postgres setup:

```bash
git clone <your-repo-url>
cd employee-management-system

docker compose up --build
```

Wait until all services are healthy. The API auto-migrates and seeds on startup.

| Service | URL |
|---|---|
| Web app | http://localhost:8080 |
| API | http://localhost:4000/api/v1 |
| API docs (Swagger) | http://localhost:4000/api/docs |

**Default login**

```
Email:    admin@ems.local
Password: Admin@12345
```

Stop the stack: `Ctrl+C`, then `docker compose down`. To wipe the database volume:
`docker compose down -v`.

---

## Local development

Use this when you want hot reload on the client and API.

### 1. Clone and install

```bash
git clone <your-repo-url>
cd employee-management-system

# Install each package (no workspaces — install all four)
npm install
npm install --prefix shared
npm install --prefix server
npm install --prefix client
```

### 2. PostgreSQL

Create an empty database named `ems` (or any name — match `DATABASE_URL`):

```bash
# macOS / Linux (if psql CLI is available)
createdb ems

# Or in psql:
# CREATE DATABASE ems;
```

On **Windows**, create the database via pgAdmin or:

```powershell
psql -U postgres -c "CREATE DATABASE ems;"
```

Ensure PostgreSQL is running and your user can connect.

### 3. Environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:

- Set `DATABASE_URL` to your Postgres connection string.
- Set **unique** `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (each at least 16 characters).
- Keep `CORS_ORIGIN=http://localhost:5173` for the Vite dev server.

`client/.env` can stay at the default (`VITE_API_URL=http://localhost:4000/api/v1`).

### 4. Build shared types, migrate, seed

```bash
npm run build:shared
npm run migrate
npm run seed
```

- **`migrate`** applies `server/db/migrations/*.sql` in order (safe to re-run; already-applied files are skipped).
- **`seed`** creates the default admin user (idempotent — skips if the admin already exists).

### 5. Start dev servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Client (Vite) | http://localhost:5173 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |

Log in with `admin@ems.local` / `Admin@12345`.

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
| `CORS_ORIGIN` | Allowed browser origin | `http://localhost:5173` (dev) or `http://localhost:8080` (Docker client) |
| `PUBLIC_URL` | Base URL for avatar upload links | `http://localhost:4000` |
| `LOG_LEVEL` | Pino log level | `info` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | First admin user (seed only) | `admin@ems.local` / `Admin@12345` |

**`client/.env`** (copy from `client/.env.example`):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:4000/api/v1` |

> **Docker:** JWT secrets in `docker-compose.yml` are for local demos only. Change them before any real deployment.

---

## Scripts (run from the repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Start **API (:4000) + client (:5173)** together in watch mode |
| `npm run build` | Build `shared` → compile `server` → bundle `client` |
| `npm run build:shared` | Build only the shared type contract |
| `npm run migrate` | Apply pending SQL migrations (transactional) |
| `npm run seed` | Seed the default admin user (idempotent) |
| `npm run typecheck` | Type-check server + client (no emit) |
| `npm run test` | Run server + client test suites |
| `npm run lint` | ESLint over the whole repo |
| `npm run format` | Format with Prettier |

Package-specific:

```bash
npm --prefix server run start    # run compiled API (after npm run build)
npm --prefix client run preview  # serve production client build
```

---

## POC features (demo guide)

After logging in:

| Feature | Where | What to try |
|---|---|---|
| **Virtualized employee feed** | Employees page | Scroll a long list; switch Vertical / Horizontal scroll modes |
| **Employee QR code** | Employees → QR icon on a card | Shows a unique QR; scan opens `/employees/qr/:id` profile card |
| **Peer chat** | Top bar → chat icon | Start a new chat, send messages; open a second browser/user to see realtime delivery |

**QR scanning from a phone:** the QR encodes your machine’s origin (e.g. `http://localhost:5173/...`).
A phone cannot reach `localhost` on your PC. For mobile testing, run Vite with network access:

```bash
npm --prefix client run dev -- --host
```

Then use your PC’s LAN IP in the QR link (e.g. `http://192.168.1.10:5173/employees/qr/<id>`), and ensure
`CORS_ORIGIN` in `server/.env` allows that origin if needed.

**Chat:** requires migration `004_chat.sql`. If chat APIs return 500, run `npm run migrate` again on a
fresh or up-to-date database.

---

## Troubleshooting

### `npm run migrate` fails on a database that already has tables

Migrations are tracked in `schema_migrations`. If the DB was created manually (tables exist but no
migration history), either:

1. **Fresh start (dev only):** drop and recreate the database, then `npm run migrate && npm run seed`, or  
2. **Mark prior migrations as applied** (if schema already matches), then run migrate for new files only:

```sql
INSERT INTO schema_migrations (filename) VALUES
  ('001_init.sql'),
  ('002_employee_code_seq.sql'),
  ('003_token_version.sql')
ON CONFLICT DO NOTHING;
```

Then run `npm run migrate` again for any pending files (e.g. `004_chat.sql`).

### API won’t start — `DATABASE_URL` / connection refused

- Confirm Postgres is running.
- Test: `psql "$DATABASE_URL"` (or use pgAdmin).
- Check host, port, user, password, and database name in `server/.env`.

### Client loads but API calls fail (CORS / network)

- `VITE_API_URL` must match where the API listens (default `http://localhost:4000/api/v1`).
- `CORS_ORIGIN` in `server/.env` must match the **browser** origin (e.g. `http://localhost:5173` for Vite dev).
- Restart the API after changing `.env`.

### `Cannot find module '@ems/shared'` or type errors

```bash
npm run build:shared
```

Re-run after pulling changes that touch `shared/`.

### Port already in use

- API default: `4000` — change `PORT` in `server/.env` and update `VITE_API_URL` / `CORS_ORIGIN` accordingly.
- Client default: `5173` — Vite will suggest another port if busy.
- Docker Postgres: `5432` — stop a local Postgres instance or change the compose port mapping.

### Login fails after seed

- Re-run `npm run seed` (idempotent).
- Or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `server/.env` **before** seeding on a fresh DB.

---

## Testing

```bash
npm run test          # server + client
npm --prefix server run test    # server only (Vitest)
npm --prefix client run test    # client only (Vitest + jsdom)
```

---

## API documentation & realtime

- **Swagger UI:** `/api/docs` — OpenAPI spec in `server/openapi.yaml`.
- **WebSocket:** `/ws?token=<accessToken>` — JWT-authenticated push channel for notifications, task
  updates, and chat messages. REST remains the source of truth; WS delivers live events.

---

## Architecture (in brief)

- **Backend** — feature-based `modules/*`, layered `route → controller → service → repository`.
  SQL only in repositories; central error handler maps `AppError` to JSON.
- **Frontend** — feature-based `features/*`, shared `components/` design system, Context + hooks,
  lazy-loaded routes.
- **Contract** — request/response types in `shared/`, imported by both sides.

Full design: [`docs/TECHNICAL_DOCUMENTATION.md`](docs/TECHNICAL_DOCUMENTATION.md).

---

## Continuous integration

`.github/workflows/ci.yml` runs **typecheck → lint → test → build** on every push.

---

## Publishing / sharing this repo

1. Ensure `.env` files are **not** committed (only `.env.example`).
2. Add your public clone URL to this README where `<your-repo-url>` appears.
3. For reviewers: Docker path is the fastest smoke test; local dev is best for exploring POC features.
4. Document any demo video or tracker links in your course submission separately.
