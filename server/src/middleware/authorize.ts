import type { RequestHandler } from 'express';
import type { RoleName } from '@ems/shared';
import { ForbiddenError, UnauthenticatedError } from '../common/errors';

/**
 * Role-based access control. Usage: `authorize('admin', 'hr')`.
 *
 * Runs AFTER `authenticate` (which sets req.user). Authentication answers "who are you?";
 * authorization answers "are you allowed?" — two distinct concerns, two distinct middleware.
 * The role comes from the JWT, so this check needs no database round-trip.
 */
export function authorize(...allowedRoles: RoleName[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthenticatedError());
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
