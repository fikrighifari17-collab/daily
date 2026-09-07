import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = "Jrfikrizero123SuperSecretDailyAuthKey2026";

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

/**
 * Strictly verifies JWT bearer token from Authorization header.
 * Returns the authenticated userId or null if invalid/missing.
 * Completely eliminates any insecure username header bypass.
 */
export function verifyToken(req: any): number | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  try {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: number; id?: number };
    const id = decoded.userId || decoded.id;
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}

/**
 * In-memory sliding window rate limiter for login protection.
 * Prevents brute-force credential stuffing.
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 10 * 60 * 1000 // 10 minutes
): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up if expired
  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
