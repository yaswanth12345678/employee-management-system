# AI Setup — safein5-fe

This document captures the complete AI tooling configuration for this project:
Cursor rules, hooks, and MCP servers. Every teammate gets the same setup automatically
by opening this repo in Cursor.

---

## Table of Contents

1. [Rules](#rules)
2. [Hooks](#hooks)
3. [Skills](#skills)
4. [MCP Servers](#mcp-servers)
5. [Backend Applicability](#backend-applicability)
6. [Maintenance Guide](#maintenance-guide)

---

## Rules

Rules live in `.cursor/rules/`. They provide persistent AI guidance — the agent reads
them before generating or editing code in this project.

### `architecture-components.mdc`
**Applies to:** `**/*.ts`, `**/*.tsx`

| Rule | Description |
|------|-------------|
| A2 | `src/components/ui/` = presentational only. `src/components/feature/` = logic + UI. |
| A3 | Each component is its own folder: `index.tsx`, `model.tsx`, `helper.tsx`, `constant.tsx`, `action.tsx`, `query.tsx`. Create files only when the concern exists. |
| A4 | Types live in `model.tsx` of the owning component. Never create `src/types/`. |
| A5 | All files use `.tsx` extension, even non-JSX ones. |
| A6 | Always import via `@/` alias. Never use `../../` across folders. |

---

### `env-config.mdc`
**Applies to:** `**/*.ts`, `**/*.tsx`

| Rule | Description |
|------|-------------|
| B1 | Never read `import.meta.env` directly. All env access goes through `src/utils/env.ts`. |
| B2 | Three environments: `development` / `staging` / `production` via Vite mode + `.env.<mode>`. |

---

### `auth-security.mdc`
**Always active**

| Rule | Description |
|------|-------------|
| C1 | Tokens in httpOnly cookies only. Never `localStorage` or `sessionStorage`. |
| C2 | All API fetches use `credentials: 'include'`. No `Authorization: Bearer` header. |
| C3 | Logout is a server round-trip — client cannot delete httpOnly cookies. |
| C4 | Short-lived access token + longer-lived refresh token. Both httpOnly. |
| C5 | All API/user HTML must go through DOMPurify before `dangerouslySetInnerHTML`. |

---

### `styling-design-system.mdc`
**Applies to:** `**/*.tsx`, `**/*.css`

| Rule | Description |
|------|-------------|
| D1 | Compose all Tailwind classes via `cn()` from `@/utils/cn`. |
| D2 | Use `class-variance-authority` (`cva`) for any component with visual variants. |
| D3 | Tailwind v4 via `@tailwindcss/vite` plugin. No `tailwind.config.js`. |
| D4 | No inline `style={{}}` or hardcoded hex colors. Use shadcn/ui CSS variable tokens. |
| D5 | Icons: `@mui/icons-material` only. Colors: shadcn tokens only. Primitives: `src/components/ui/` only. |

---

### `code-quality.mdc`
**Applies to:** `**/*.ts`, `**/*.tsx`

| Rule | Description |
|------|-------------|
| E1 | No `any`. Use `unknown` + type guards. Discriminated unions handled exhaustively. |
| E2 | Prettier + ESLint enforced. 2-space indent, no tabs. `npm run format` before commit. |
| E3 | `npx tsc -b --noEmit` must pass clean before any PR. |
| E4 | Vitest with coverage for all new pure logic. No Playwright. |

---

### `code-navigation.mdc`
**Always active**

| Rule | Description |
|------|-------------|
| F1 | LSP is mandatory. Use go-to-definition / find-references / rename-symbol. If LSP is unavailable, make it available before proceeding. Grep/Glob only for string literals and path patterns. |

---

### `react-patterns.mdc`
**Applies to:** `**/*.tsx`

| Rule | Description |
|------|-------------|
| S1 | Mobile-first only. Never use `max-*` breakpoint variants. |
| S2 | Named exports only. No `export default` from component folders. |
| S3 | TanStack Query for all server state. No `useEffect` + `fetch`. |
| S4 | Single `createBrowserRouter` in `src/AppRoute/index.tsx`. No scattered `<Route>` trees. |
| S5 | `@/` for cross-folder imports. `./` only within the same component folder. |
| S6 | Every routed page wrapped in `ErrorBoundary` with a fallback UI. |
| S7 | Every page-level component code-split with `React.lazy` + `Suspense`. |

---

### `git-workflow.mdc`
**Always active**

| Rule | Description |
|------|-------------|
| G1 | On any "start a feature / bugfix / ticket" trigger phrase, create a branch **before** writing any code. |
| G2 | Branch naming: `feature/<ticket-or-desc>` or `bugfix/<ticket-or-desc>`. Ticket numbers preserved exactly (e.g. `SAFE-123`). Description: lowercase, hyphen-separated, max 4–5 words. |
| G3 | Always `git checkout main && git pull origin main` before branching — never branch from a stale base. |
| G4 | If already on a non-main branch when a new feature is mentioned, ask the user whether to finish the current branch first. |

---

### `project-conventions.mdc`
**Always active**

| Rule | Description |
|------|-------------|
| S8 | PWA: never cache `/api/auth/*` routes. Always `NetworkOnly` for auth endpoints. |
| S9 | Conventional Commits enforced. Types: `feat\|fix\|chore\|refactor\|test\|docs\|style\|perf\|build\|ci\|revert`. |
| S10 | No `console.log` in production code. Use `isDevelopment` guard or a logger. |
| H6 | No hardcoded secrets in source files. Use `src/utils/env.ts` + `.env.local`. |
| H7 | AI must not install packages without user approval. `hook-dep-install` intercepts `npm install <pkg>`. |
| G2 | All 8 hooks run automatically — see Hooks section. |

---

## Hooks

Hooks live in `.cursor/hooks/` and are wired via `.cursor/hooks.json`. They run
automatically — no manual invocation needed.

```
.cursor/
├── hooks.json          ← event wiring
└── hooks/
    ├── hook-protect-env.mjs        ← H1
    ├── hook-format-and-lint.mjs    ← H2
    ├── hook-style-guardrail.mjs    ← H3
    ├── hook-readme-sync.mjs        ← H4
    ├── hook-commit-guard.mjs       ← H5
    ├── hook-secret-scan.mjs        ← H6
    ├── hook-dep-install.mjs        ← H7
    └── hook-branch-guard.mjs       ← H8
```

| # | Hook | Trigger | What it does | Fails |
|---|------|---------|-------------|-------|
| H1 | `hook-protect-env` | `preToolUse` — Read/Write/Shell | Blocks access to real `.env*` files. Allows `.env.example` / `.env.sample`. | Closed |
| H2 | `hook-format-and-lint` | `afterFileEdit` — Write | Runs `eslint --fix` + `prettier --write` on every written `.ts/.tsx/.js/.json/.css`. | Open |
| H3 | `hook-style-guardrail` | `afterFileEdit` — Write | Scans `src/**/*.tsx` for inline styles, hex colors, `max-*` breakpoints, non-MUI icons, missing `cn()`. | Open |
| H4 | `hook-readme-sync` | `stop` | On session end: if source changed and `README.md` exists, forces the agent to update affected doc sections (once per changeset). | Open |
| H5 | `hook-commit-guard` | `beforeShellExecution` — `git commit` | Blocks commit messages that don't follow Conventional Commits format. | Open |
| H6 | `hook-secret-scan` | `preToolUse` — Write | Scans file content for hardcoded API keys, tokens, passwords before writing. | Open |
| H7 | `hook-dep-install` | `beforeShellExecution` — `npm install` | Shows an approval card before any new package is added to `package.json`. | Open |
| H8 | `hook-branch-guard` | `beforeShellExecution` — `git checkout -b` / `git switch -c` | Blocks branch creation if name doesn't follow `feature/*` or `bugfix/*` convention. | Open |

> **Fail Closed** = blocks the action even on script error (H1 only).
> **Fail Open** = allows through on script error — a guardrail bug never blocks work.

---

## Skills

Skills are personal AI agent workflows stored in `~/.claude/skills/`. They are not
committed to the repo — each developer installs them once on their machine.

| Skill | Trigger phrases | What it does |
|-------|----------------|-------------|
| `git-commit` | "commit", "do a commit", "create a commit message" | Reads staged + unstaged diff, generates a Conventional Commits summary, shows `Proceed? [Y/n/edit]`, then stages → commits → pushes on Y. No PR is created. |
| `raise-pr` | "raise PR", "open a PR", "create a pull request", "submit a PR" | Runs `npm run lint` → `npm run format:check` → `npm run test -- --run` sequentially. Stops on first failure. On all-pass, asks for target base branch (default: `main`), then creates the PR via `gh pr create`. |

### Installing the skills

Skills ship separately from the repo. To install them on a new machine:

1. Copy `git-commit/SKILL.md` to `~/.claude/skills/git-commit/SKILL.md`
2. Copy `raise-pr/SKILL.md` to `~/.claude/skills/raise-pr/SKILL.md`

---

## MCP Servers

Configured in `.cursor/mcp.json`. All servers run via `npx` (no global install needed).

| Server | Package | Tools | Purpose |
|--------|---------|-------|---------|
| `github` | `@modelcontextprotocol/server-github` | 26 | PR management, issues, code review, branch ops |
| `context7` | `@upstash/context7-mcp` | 2 | Live, version-specific docs for React 19, Vite, Tailwind v4, TanStack Query, shadcn/ui |
| `memory` | `@modelcontextprotocol/server-memory` | 9 | Persistent context across sessions — project decisions, conventions, choices |
| `sequential-thinking` | `@modelcontextprotocol/server-sequential-thinking` | 1 | Structured multi-step reasoning for complex tasks |

### GitHub MCP — one-time setup

Set `GITHUB_PERSONAL_ACCESS_TOKEN` as a Windows user environment variable:

1. Win+S → "Edit the system environment variables" → User variables → New
2. Name: `GITHUB_PERSONAL_ACCESS_TOKEN` / Value: your GitHub PAT
3. Required scopes: `repo`, `read:org`, `read:user`
4. Restart Cursor after setting

---

## Backend Applicability

For the backend repo, the following transfer directly:

**Rules (port as-is):** E1, E2, E3, F1, S2, S5, S9, S10, A6, B1, B2, G1, G2, G3, G4

**Rules (adapt for backend):**
- A3 → same folder-per-module concept, `.ts` extension, different files (controller/service/dto/repository)
- A4 → types in `model.ts` of the owning module, no central `types/`
- C3/C4 → backend *implements* logout endpoint and refresh token flow
- E4 → same coverage principle, use Jest or Vitest
- S4 → single route registry concept (one file per domain that registers routes)
- S10 → use a structured logger (Pino / Winston) instead of `console.log`

**Hooks (port as-is):** H1, H2, H4, H5, H6, H7, H8

**Hooks (skip):** H3 — Tailwind/React specific

**Skills:**

| Skill | Backend applicability |
|-------|-----------------------|
| `git-commit` | Port as-is — works for any Node.js/NestJS repo |
| `raise-pr` | Adapt `format:check` and `test` script names to match the backend's `package.json` (e.g. `npm run test:unit` instead of `npm run test -- --run`) |

**MCP (all apply):** GitHub, Context7 (useful for Node.js/NestJS/Prisma docs), Memory, Sequential Thinking

---

## Maintenance Guide

### Adding a new rule
1. Create `.cursor/rules/<name>.mdc`
2. Set `alwaysApply: true` for project-wide rules, or `globs:` for file-specific
3. Keep it under 50 lines, one concern per file
4. If the rule can be mechanically enforced, add a corresponding hook

### Adding a new hook
1. Write the script in `.cursor/hooks/hook-<name>.mjs`
2. Use the Windows-safe stdin pattern (idle timer + hard timeout)
3. Always fail open unless security-critical
4. Add the hook to `.cursor/hooks.json` with the right event and matcher
5. Document the hook in this file and in `project-conventions.mdc`

### Adding a new MCP server
1. Add an entry to `.cursor/mcp.json`
2. Document it in this file
3. Note any required API keys / env vars

### Updating a hook safely
Always write the updated script **before** re-enabling `hooks.json`.
If a deadlock occurs (hook blocks all writes), delete `hooks.json`, reload Cursor
(`Ctrl+Shift+P → Reload Window`), fix the script, then restore `hooks.json`.
