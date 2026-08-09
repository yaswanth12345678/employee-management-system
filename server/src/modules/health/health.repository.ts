import { pingDatabase } from '../../db/pool';

/** Probe whether PostgreSQL accepts connections. Throws if unreachable. */
export async function checkDatabase(): Promise<void> {
  await pingDatabase();
}
