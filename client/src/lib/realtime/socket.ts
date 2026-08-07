import type { NotificationDTO } from '@ems/shared';
import { env } from '../../config/env';
import { getAccessToken } from '../http';

/**
 * Single app-wide WebSocket connection to the server's /ws endpoint, authenticated with the
 * in-memory access token. Auto-reconnects with a fixed backoff. Consumers subscribe with
 * `onRealtime` and receive typed messages. The REST API stays the source of truth — these
 * messages are "something changed, refresh" signals (plus the notification payload).
 */
export type RealtimeMessage =
  | { type: 'connected' }
  | { type: 'notification'; notification: NotificationDTO }
  | { type: 'task_updated'; taskId: string; status: string };

type Handler = (message: RealtimeMessage) => void;

const handlers = new Set<Handler>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldConnect = false;

function buildUrl(token: string): string {
  const api = new URL(env.apiUrl); // e.g. http://localhost:4000/api/v1
  const proto = api.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${api.host}/ws?token=${encodeURIComponent(token)}`;
}

function open(): void {
  if (!shouldConnect || socket) return;
  const token = getAccessToken();
  if (!token) {
    scheduleReconnect();
    return;
  }
  // Capture THIS instance so the async callbacks below can tell whether they still belong to the
  // current socket. Without the `socket === ws` guard, a stale socket's late `onclose` (e.g. during
  // a fast disconnect→reconnect, or React StrictMode's double-mount) would null out the reference to
  // a newer live socket and schedule a spurious reconnect — leaving orphaned duplicate connections
  // that each deliver every frame, double-counting notifications.
  const ws = new WebSocket(buildUrl(token));
  socket = ws;

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data as string) as RealtimeMessage;
      handlers.forEach((handler) => handler(message));
    } catch {
      /* ignore malformed frames */
    }
  };
  ws.onclose = () => {
    if (socket !== ws) return; // superseded by a newer socket; ignore this stale close
    socket = null;
    if (shouldConnect) scheduleReconnect();
  };
  ws.onerror = () => {
    if (socket === ws) ws.close();
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    open();
  }, 3000);
}

export function connectRealtime(): void {
  shouldConnect = true;
  open();
}

export function disconnectRealtime(): void {
  shouldConnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}

/** Subscribe to realtime messages. Returns an unsubscribe function. */
export function onRealtime(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
