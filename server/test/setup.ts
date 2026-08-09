/**
 * Test bootstrap only: assign process.env BEFORE any src module imports config/env.ts.
 * This is the sole exception to "never touch process.env outside config/env.ts" — writing
 * here is required so Zod validation passes without a real .env during unit tests.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://placeholder@localhost:5432/placeholder';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-16-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-16-chars';
process.env.BCRYPT_ROUNDS = '8';
