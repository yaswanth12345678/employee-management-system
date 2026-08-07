import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * Password hashing wrapper (bcrypt).
 *
 * We NEVER store plaintext passwords. bcrypt is deliberately slow and salts each hash, so two
 * users with the same password get different hashes and brute-forcing is expensive. The cost
 * factor (rounds) is configurable via env so it can be raised as hardware gets faster.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
