import type { Request, Response } from 'express';
import type { ApiResponse } from '@ems/shared';
import * as healthService from './health.service';

/**
 * Liveness probe: "is the process up?" — must NOT depend on external systems.
 */
export function liveness(_req: Request, res: Response): void {
  const body: ApiResponse<{ status: string; uptimeSeconds: number }> = {
    data: healthService.getLiveness(),
  };
  res.status(200).json(body);
}

/**
 * Readiness probe: "can this instance serve real traffic?" — checks the database.
 * Failures throw ServiceUnavailableError → 503 via the central error handler.
 */
export async function readiness(_req: Request, res: Response): Promise<void> {
  const data = await healthService.getReadiness();
  const body: ApiResponse<{ status: string; database: string }> = { data };
  res.status(200).json(body);
}
