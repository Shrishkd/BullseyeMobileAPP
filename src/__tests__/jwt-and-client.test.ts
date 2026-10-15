import { ApiError, unwrapErrorField } from '@/api/client';
import { getJwtExpiry, isJwtExpired } from '@/lib/jwt';

function fakeJwt(payload: object) {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signature`;
}

describe('jwt', () => {
  it('reads exp in milliseconds', () => {
    expect(getJwtExpiry(fakeJwt({ sub: '1', exp: 1_800_000_000 }))).toBe(1_800_000_000_000);
  });

  it('detects expiry with clock skew', () => {
    const token = fakeJwt({ exp: 1000 });
    expect(isJwtExpired(token, 1_000_000 - 60_000)).toBe(false);
    expect(isJwtExpired(token, 1_000_000 - 10_000)).toBe(true);
  });

  it('leaves unknown token shapes to the server', () => {
    expect(getJwtExpiry('not-a-jwt')).toBeNull();
    expect(isJwtExpired('not-a-jwt')).toBe(false);
  });
});

describe('unwrapErrorField', () => {
  it('passes normal payloads through', () => {
    expect(unwrapErrorField({ overall_risk_level: 'Low' })).toEqual({ overall_risk_level: 'Low' });
  });

  it('turns a 200 { error } body into an ApiError', () => {
    expect(() => unwrapErrorField({ error: 'No holdings found.' })).toThrow(ApiError);
    try {
      unwrapErrorField({ error: 'No holdings found.' });
    } catch (e) {
      expect((e as ApiError).status).toBe(200);
      expect((e as ApiError).message).toBe('No holdings found.');
    }
  });
});
