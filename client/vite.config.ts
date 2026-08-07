import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server + build config. The React plugin enables Fast Refresh (HMR) and the
// automatic JSX runtime. We keep the dev port aligned with the server's CORS_ORIGIN.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
