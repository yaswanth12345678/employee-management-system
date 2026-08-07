-- =========================================================================
-- 003 · token_version for refresh-token revocation.
-- Bumped on logout / password change / password reset; refresh tokens carry the
-- version they were issued with and are rejected once it no longer matches.
-- =========================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
