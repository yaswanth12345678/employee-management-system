/**
 * Typed, centralized access to build-time environment variables.
 *
 * Like the server's config module, nothing else in the app reads `import.meta.env` directly —
 * everyone imports `env`. That gives one place to add defaults, and one place to change if a
 * variable is renamed.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
} as const;
