import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '../libs/jwt';
import { logger } from '../libs/logger';

/**
 * Realtime layer: a JWT-authenticated WebSocket server attached to the same HTTP server.
 *
 * Clients connect to `ws(s)://<host>/ws?token=<accessToken>`. We verify the access token at
 * connect time and register the socket under its user id, so the app can push events to a
 * specific user (`emitToUser`) or everyone (`emitToAll`). A heartbeat ping/pong reaps dead
 * connections. This is additive infrastructure — the REST API remains the source of truth; WS
 * only delivers "something changed, refresh" signals (and the notification payload).
 */
interface AuthedSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
}

const userSockets = new Map<string, Set<AuthedSocket>>();
let wss: WebSocketServer | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;

function register(userId: string, ws: AuthedSocket): void {
  const set = userSockets.get(userId) ?? new Set<AuthedSocket>();
  set.add(ws);
  userSockets.set(userId, set);
}

function unregister(ws: AuthedSocket): void {
  if (!ws.userId) return;
  const set = userSockets.get(ws.userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(ws.userId);
}

export function initRealtime(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: AuthedSocket, req) => {
    // Authenticate via the ?token= query param. The browser WebSocket API can't set request headers
    // on the handshake, so this is the standard fallback. Accepted tradeoff: query strings can land
    // in proxy/access logs — the hardening path (out of scope here) is a short-lived one-time WS
    // ticket minted over REST, or carrying the token in the Sec-WebSocket-Protocol subprotocol.
    let payload;
    try {
      const url = new URL(req.url ?? '', 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) throw new Error('missing token');
      payload = verifyAccessToken(token);
      if (payload.type !== 'access') throw new Error('wrong token type');
    } catch {
      socket.close(1008, 'Unauthorized');
      return;
    }

    socket.userId = payload.sub;
    socket.isAlive = true;
    register(socket.userId, socket);

    // Bound the socket's lifetime to the access token's own expiry. Auth happens only once at
    // connect, so without this a socket opened with a ~15m token would stay authorized for as long
    // as it answered heartbeats — long after the token expired or the account was deactivated. When
    // it closes, the client reconnects: while its access token is still valid the socket re-opens;
    // once it has expired the reconnect keeps retrying until the next API 401 refreshes the token
    // (or, if the session was revoked, that refresh fails and the client logs out) — re-tying the
    // WS session to the access-token window.
    if (payload.exp) {
      const ttlMs = payload.exp * 1000 - Date.now();
      const expiry = setTimeout(() => socket.close(1000, 'token expired'), Math.max(0, ttlMs));
      expiry.unref?.();
      socket.on('close', () => clearTimeout(expiry));
    }

    socket.on('pong', () => {
      socket.isAlive = true;
    });
    socket.on('close', () => unregister(socket));
    socket.on('error', () => unregister(socket));

    socket.send(JSON.stringify({ type: 'connected' }));
  });

  // Heartbeat: terminate sockets that didn't answer the previous ping.
  heartbeat = setInterval(() => {
    wss?.clients.forEach((client) => {
      const socket = client as AuthedSocket;
      if (socket.isAlive === false) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30_000);
  heartbeat.unref?.();

  logger.info('Realtime WebSocket server ready at /ws');
}

/** Push a JSON payload to every live socket of a specific user. */
export function emitToUser(userId: string, payload: unknown): void {
  const set = userSockets.get(userId);
  if (!set) return;
  const data = JSON.stringify(payload);
  set.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(data);
  });
}

/** Broadcast a JSON payload to every connected client. */
export function emitToAll(payload: unknown): void {
  if (!wss) return;
  const data = JSON.stringify(payload);
  wss.clients.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(data);
  });
}

export async function closeRealtime(): Promise<void> {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  const server = wss;
  if (!server) return;
  // Actively terminate live sockets. `wss.close()` alone does NOT drop existing connections, and
  // because each WS is an upgraded HTTP connection, leaving them open would block the HTTP server's
  // own `close()` callback forever (deadlocking graceful shutdown). terminate() destroys them.
  for (const client of server.clients) client.terminate();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  wss = null;
}
