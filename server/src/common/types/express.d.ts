import type { RoleName } from '@ems/shared';

/**
 * Augment Express's Request type with the authenticated user that the `authenticate`
 * middleware attaches. This gives every downstream controller strongly-typed access to
 * `req.user` instead of casting `(req as any).user`.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: RoleName;
      };
    }
  }
}

export {};
