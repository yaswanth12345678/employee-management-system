import type { Request, Response } from 'express';
import type { ApiResponse } from '@ems/shared';
import { pingDatabase } from '../../db/pool';

const startedAt = Date.now();

/**
 * Liveness probe: "is the process up?" — must NOT depend on external systems, so an
 * orchestrator (Docker, Kubernetes) doesn't kill a healthy process just because the DB
 * is briefly unreachable.
 */
export function liveness(_req: Request, res: Response): void {
  const body: ApiResponse<{ status: string; uptimeSeconds: number }> = {
    data: { status: 'ok', uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) },
  };
  res.status(200).json(body);
}

/**
 * Readiness probe: "can this instance serve real traffic?" — this one DOES check the
 * database. Returns 503 when the dependency is down so load balancers stop routing to it.
 */
export async function readiness(_req: Request, res: Response): Promise<void> {
  try {
    await pingDatabase();
    const body: ApiResponse<{ status: string; database: string }> = {
      data: { status: 'ready', database: 'up' },
    };
    res.status(200).json(body);
  } catch {
    res.status(503).json({
      error: { code: 'INTERNAL', message: 'Database not reachable' },
    });
  }
}
