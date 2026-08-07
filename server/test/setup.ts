// Provide a valid environment BEFORE any src module (which imports config/env) is loaded,
// so env validation passes without a real .env during tests.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://placeholder@localhost:5432/placeholder';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-16-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-16-chars';
process.env.BCRYPT_ROUNDS = '8';
