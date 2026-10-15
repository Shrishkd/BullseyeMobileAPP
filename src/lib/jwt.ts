/**
 * Reads the `exp` claim of a JWT without verifying it. The server is the only
 * authority on validity; this is used to log out proactively when the token
 * (60 min lifetime, no refresh endpoint yet) has expired.
 */
export function getJwtExpiry(token: string): number | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when the token is expired or will expire within `skewMs`. */
export function isJwtExpired(token: string, now = Date.now(), skewMs = 30_000): boolean {
  const exp = getJwtExpiry(token);
  if (exp === null) return false; // Unknown shape: let the server decide.
  return exp - skewMs <= now;
}
