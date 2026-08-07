import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { load as loadYaml } from 'js-yaml';
import { apiRouter } from './routes';
import { UPLOADS_DIR } from './libs/upload';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './libs/logger';
import { env } from './config/env';

/**
 * Assembles the Express application. ORDER MATTERS — middleware runs top to bottom:
 *   1. helmet        — security response headers
 *   2. cors          — allow the browser client's origin (with credentials for the cookie)
 *   3. body parsers  — populate req.body
 *   4. request logger
 *   5. API routes
 *   6. notFound      — anything unmatched becomes a 404 error
 *   7. errorHandler  — the terminal error-to-JSON translator (MUST be last)
 *
 * `createApp` returns the app WITHOUT calling listen(), which keeps it importable and
 * testable (supertest can drive it) — a separation of "build the app" from "run the app".
 */
export function createApp(): Express {
  const app = express();

  // Base security headers (X-Content-Type-Options: nosniff, etc.). We manage CSP ourselves below
  // rather than via helmet's default so we can relax it for JUST the Swagger UI route.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Strict Content-Security-Policy on EVERY response except the Swagger docs (whose UI needs inline
  // assets). This is the app-wide defense that stops any stray HTML/SVG served from this origin —
  // e.g. an uploaded file — from executing script. Disabling CSP globally (as before) removed it.
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/docs')) {
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }
    next();
  });

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser()); // parses the httpOnly refresh cookie into req.cookies
  app.use(pinoHttp({ logger }));

  // Serve uploaded files (avatars) statically. Defense-in-depth so a maliciously-typed upload can
  // never execute: `nosniff` stops MIME sniffing, `Content-Disposition: attachment` forces a
  // download (ignored by <img>, honored on direct navigation), and a locked-down CSP blocks script.
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => {
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'attachment');
      },
    }),
  );

  // API documentation (Swagger UI). Best-effort — disabled if the spec can't be read.
  try {
    const spec = loadYaml(readFileSync(join(process.cwd(), 'openapi.yaml'), 'utf8')) as Record<
      string,
      unknown
    >;
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  } catch (err) {
    logger.warn({ err }, 'OpenAPI spec not loaded; /api/docs disabled');
  }

  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
