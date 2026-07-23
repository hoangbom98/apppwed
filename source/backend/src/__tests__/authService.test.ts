/**
 * __tests__/authService.test.ts
 * Unit tests for shared/services/authService.ts — password + JWT helpers.
 * Tests run entirely in-process — no database, no network.
 */

// Set test env vars before importing the module
process.env.JWT_SECRET         = 'test_jwt_secret_must_be_at_least_32_characters_for_safety';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_must_be_at_least_32_characters_okay';
process.env.NODE_ENV           = 'test';

import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyToken,
} from '../shared/services/authService';

describe('hashPassword / comparePassword', () => {
  test('hashPassword returns a bcrypt hash', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).toBeTruthy();
    expect(hash.startsWith('$2')).toBe(true);
    expect(hash).not.toBe('Password123!');
  });

  test('comparePassword returns true for matching password', async () => {
    const hash  = await hashPassword('Secure@999');
    const match = await comparePassword('Secure@999', hash);
    expect(match).toBe(true);
  });

  test('comparePassword returns false for wrong password', async () => {
    const hash  = await hashPassword('Correct');
    const match = await comparePassword('Wrong', hash);
    expect(match).toBe(false);
  });
});

describe('generateTokens / verifyToken', () => {
  const payload = { id: 1, email: 'user@test.com', role: 'user', project: 'hub' };

  test('generateTokens returns access_token and refresh_token strings', () => {
    const { access_token, refresh_token } = generateTokens(payload);
    expect(typeof access_token).toBe('string');
    expect(access_token.split('.').length).toBe(3);    // JWT has 3 parts
    expect(typeof refresh_token).toBe('string');
    expect(refresh_token.split('.').length).toBe(3);
  });

  test('verifyToken decodes the access_token correctly', () => {
    const { access_token } = generateTokens(payload);
    const decoded = verifyToken(access_token);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('user@test.com');
    expect(decoded.role).toBe('user');
    expect(decoded.project).toBe('hub');
  });

  test('verifyToken throws on tampered token', () => {
    const { access_token } = generateTokens(payload);
    const tampered = access_token.slice(0, -3) + 'xxx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('generateTokens throws when project field is missing', () => {
    expect(() => generateTokens({ id: 2, email: 'x@x.com', role: 'user', project: '' }))
      .toThrow(/project/);
  });

  test('generateTokens throws when project value is invalid', () => {
    expect(() => generateTokens({ id: 3, email: 'y@y.com', role: 'user', project: 'unknown' }))
      .toThrow(/invalid project/i);
  });
});
