import { createApp } from './app';
import { env } from './config/env';
import { logger } from './libs/logger';
import { pool } from './db/pool';
import { closeRealtime, initRealtime } from './realtime/realtime';

/**
 * Process entry point: build the app, start listening, and shut down gracefully.
 *
 * Graceful shutdown matters in production: on deploy, the orchestrator sends SIGTERM.
 * We stop accepting new connections, let in-flight requests finish, drain the DB pool,
 * then exit — instead of dropping live requests. A watchdog force-exits if that hangs.
 */
const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Attach the realtime WebSocket server to the same HTTP server.
initRealtime(server);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return; // ignore a second SIGTERM/SIGINT while already draining
  shuttingDown = true;
  logger.info(`${signal} received — shutting down gracefully...`);

  // If graceful shutdown stalls, don't hang forever.
  const watchdog = setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
  watchdog.unref();

  try {
    // Terminate WebSocket clients FIRST. They are upgraded HTTP connections; if left open they
    // keep server._connections > 0 and server.close()'s callback would never fire.
    await closeRealtime();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
      // Drop only IDLE keep-alive sockets so close() isn't blocked waiting on them; in-flight
      // requests are left to finish (the watchdog above is the backstop if one never does). WS
      // clients were already terminated by closeRealtime(). NOT closeAllConnections() — that would
      // abort live requests on every deploy, defeating the graceful-shutdown contract above.
      server.closeIdleConnections?.();
    });
    await pool.end();
    logger.info('HTTP server closed, realtime stopped, DB pool drained. Goodbye.');
    clearTimeout(watchdog);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown.');
    clearTimeout(watchdog);
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
