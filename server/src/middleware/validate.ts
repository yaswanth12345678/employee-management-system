import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { parseWith } from '../common/validation/parse';

/**
 * Validate the request BODY against a zod schema before it reaches the controller, replacing
 * it with the parsed (and coerced) data. Query params are validated inside controllers via
 * `parseWith` (req.query needs typed/coerced output that a middleware can't cleanly hand back).
 *
 * "Reject bad input at the door" — downstream code then trusts its inputs.
 */
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = parseWith(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
