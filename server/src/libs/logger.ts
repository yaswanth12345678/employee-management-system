import pino from 'pino';
import { env } from '../config/env';

/**
 * Application-wide structured logger.
 *
 * In development we pipe through `pino-pretty` for readable, colorized output.
 * In production we emit newline-delimited JSON — the format log aggregators
 * (Datadog, CloudWatch, ELK) ingest and index. Structured logs are searchable;
 * `console.log` strings are not.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});
