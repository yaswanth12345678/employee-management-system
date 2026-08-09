---
name: git-commit
description: >-
  Creates a Conventional Commits git commit from staged and unstaged diffs.
  Use when the user asks to commit, do a commit, or create a commit message.
---

# Git Commit

## Workflow

1. Run in parallel:
   - `git status`
   - `git diff` and `git diff --staged`
   - `git log -8 --oneline` (match message style)
2. Draft a Conventional Commits message:

```
<type>(optional-scope): <imperative summary>

Optional body explaining why.
```

Types: `feat|fix|chore|refactor|test|docs|style|perf|build|ci|revert`.

Scopes when helpful: `client`, `server`, `shared`, or module name (`auth`, `employees`).

3. Show the message and ask: `Proceed? [Y/n/edit]`
4. On **Y**:
   - Stage relevant files (`git add` — never `.env*` or secrets)
   - Commit with HEREDOC message (PowerShell-safe alternative if needed)
   - Run `git status` to verify
5. Do **not** push or open a PR unless the user asks.
6. If a hook rejects the commit: fix the issue and create a **new** commit (do not amend unless user rules allow).

## Examples

```
feat(employees): add department filter to list API
fix(client): refresh session before protected route render
chore: align prettier ignore for uploads
```
