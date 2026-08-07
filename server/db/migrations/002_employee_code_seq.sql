-- =========================================================================
-- 002 · Sequence for auto-generating human-readable employee codes (EMP-00002, ...)
-- Starts at 2 so it never collides with the seeded admin (EMP-00001).
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS employee_code_seq START WITH 2 INCREMENT BY 1;
