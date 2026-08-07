import { describe, it, expect } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocket } from 'ws';
import { initRealtime, closeRealtime } from '../src/realtime/realtime';
import { signAccessToken } from '../src/libs/jwt';

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} hung (${ms}ms)`)), ms)),
  ]);
}

describe('closeRealtime graceful shutdown', () => {
  it('terminates live authenticated clients so the HTTP server can close without deadlock', async () => {
    const httpServer: Server = createServer();
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    initRealtime(httpServer);

    // A VALID token keeps the socket open server-side (an invalid one is closed immediately and
    // wouldn't reproduce the deadlock). This upgraded connection is exactly what used to block
    // server.close()'s callback forever before closeRealtime() learned to terminate() its clients.
    const token = signAccessToken('shutdown-user', 'admin');
    const client = new WebSocket(`ws://localhost:${port}/ws?token=${encodeURIComponent(token)}`);
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        client.on('open', () => resolve());
        client.on('error', (e) => reject(e));
      }),
      3000,
      'client open',
    );
    const clientClosed = new Promise<void>((resolve) => client.on('close', () => resolve()));

    // The fix: closeRealtime() terminate()s clients then closes the wss — must resolve promptly.
    await withTimeout(closeRealtime(), 3000, 'closeRealtime');

    // And the HTTP server must now be able to close (no lingering upgraded sockets). If clients had
    // NOT been terminated, this callback would never fire and the timeout would fail the test.
    await withTimeout(
      new Promise<void>((resolve, reject) =>
        httpServer.close((err) => (err ? reject(err) : resolve())),
      ),
      3000,
      'httpServer.close',
    );

    // The client was actively dropped, not left dangling.
    await withTimeout(clientClosed, 3000, 'client close');
    expect(client.readyState).toBe(WebSocket.CLOSED);
  });
});
