/// <reference types="vite/client" />

// Strongly-type the custom environment variables we read via import.meta.env.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
