---
name: raise-pr
description: >-
  Runs lint/typecheck/tests then opens a GitHub pull request with gh.
  Use when the user asks to raise PR, open a PR, create a pull request, or submit a PR.
---

# Raise PR

## Preflight (stop on first failure)

From repo root, run sequentially:

```bash
npm run lint
npm run typecheck
npm test
```

Optional format check if available: `npx prettier --check .`

## Branch & remote

1. Ensure changes are committed on a `feature/*` or `bugfix/*` branch.
2. Confirm tracking / ahead-behind vs base (default base: `main`). Ask if base should differ.
3. `git push -u origin HEAD` if needed.

## Create PR

Use `gh pr create` with Summary + Test plan:

```bash
gh pr create --title "<conventional title>" --body "$(cat <<'EOF'
## Summary
- 

## Test plan
- [ ] 
EOF
)"
```

On Windows PowerShell, pass `--body` as a here-string if `cat <<EOF` is unavailable:

```powershell
gh pr create --title "..." --body @"
## Summary
- ...

## Test plan
- [ ] ...
"@
```

## Done

Return the PR URL. Do not merge unless asked.
