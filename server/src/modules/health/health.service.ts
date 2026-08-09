import { ServiceUnavailableError } from '../../common/errors';
import * as repo from './health.repository';

const startedAt = Date.now();

export function getLiveness(): { status: string; uptimeSeconds: number } {
  return {
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  };
}

export async function getReadiness(): Promise<{ status: string; database: string }> {
  try {
    await repo.checkDatabase();
    return { status: 'ready', database: 'up' };
  } catch {
    throw new ServiceUnavailableError('Database not reachable');
  }
}
