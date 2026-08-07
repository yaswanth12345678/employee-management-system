import { describe, it, expect, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { rateLimit } from '../src/middleware/rateLimit';
import { RateLimitError } from '../src/common/errors';

describe('rateLimit', () => {
  it('allows up to max requests then blocks with RateLimitError', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const req = { ip: '9.9.9.9', body: {} } as unknown as Request;
    const res = {} as Response;

    const call = () => {
      const next = vi.fn() as unknown as NextFunction;
      limiter(req, res, next);
      return next as unknown as ReturnType<typeof vi.fn>;
    };

    expect(call().mock.calls[0][0]).toBeUndefined(); // 1st ok
    expect(call().mock.calls[0][0]).toBeUndefined(); // 2nd ok
    const third = call().mock.calls[0][0]; // 3rd blocked
    expect(third).toBeInstanceOf(RateLimitError);
  });

  it('keys separate identities independently', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, keyFromBody: 'email' });
    const res = {} as Response;
    const run = (email: string) => {
      const next = vi.fn() as unknown as NextFunction;
      limiter({ ip: '1.1.1.1', body: { email } } as unknown as Request, res, next);
      return (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    };
    expect(run('a@x.com')).toBeUndefined();
    expect(run('b@x.com')).toBeUndefined(); // different email → own bucket
    expect(run('a@x.com')).toBeInstanceOf(RateLimitError); // a@x.com over limit
  });

  it('collapses whitespace/case variants of one identity into a single bucket', () => {
    // Regression: variants that Zod .trim().email() resolves to the SAME account must NOT each get
    // a fresh allowance, or the per-account limit is trivially bypassed.
    const limiter = rateLimit({ windowMs: 60_000, max: 1, keyFromBody: 'email' });
    const res = {} as Response;
    const run = (email: string) => {
      const next = vi.fn() as unknown as NextFunction;
      limiter({ ip: '2.2.2.2', body: { email } } as unknown as Request, res, next);
      return (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    };
    expect(run('victim@x.com')).toBeUndefined(); // 1st ok
    expect(run(' victim@x.com')).toBeInstanceOf(RateLimitError); // leading space → same bucket
    expect(run('VICTIM@x.com ')).toBeInstanceOf(RateLimitError); // case + trailing space → same
    expect(run('\tvictim@x.com\n')).toBeInstanceOf(RateLimitError); // tabs/newlines → same
  });
});
