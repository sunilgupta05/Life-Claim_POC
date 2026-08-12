// Tests for role mapping, redirect-SSO gating, and the external-JWT
// verification branch that keeps pluggable auth non-breaking (roadmap 1.4).

// jwtUtil captures JWT_SECRET at import time — set it before requiring anything.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-1_4-auth';

const { mapExternalRoles, parseJsonConfig } = require('../../src/auth/roleMapping');
const { EXTERNAL_SOURCES } = require('../../src/auth/sessionIssuer');
const samlProvider = require('../../src/auth/providers/samlProvider');
const jwtUtil = require('../../src/util/jwtUtil');
const authService = require('../../src/services/authService');

describe('mapExternalRoles', () => {
  const MAP = { 'cn=assessors,ou=groups': ['Assessor'], 'cn=verifiers': 'Verifier' };

  test('maps matching IdP groups to app roles (case/space-insensitive)', () => {
    expect(mapExternalRoles(['CN=Assessors,OU=Groups'], MAP, [])).toEqual(['Assessor']);
  });
  test('accepts a scalar mapping value', () => {
    expect(mapExternalRoles(['cn=verifiers'], MAP, [])).toEqual(['Verifier']);
  });
  test('dedupes across multiple matches', () => {
    const m = { a: ['X'], b: ['X', 'Y'] };
    expect(mapExternalRoles(['a', 'b'], m, []).sort()).toEqual(['X', 'Y']);
  });
  test('applies defaults only when nothing matched', () => {
    expect(mapExternalRoles(['unknown'], MAP, ['Assessor'])).toEqual(['Assessor']);
    expect(mapExternalRoles(['cn=verifiers'], MAP, ['Assessor'])).toEqual(['Verifier']);
  });
  test('empty result when no match and no defaults', () => {
    expect(mapExternalRoles(['unknown'], MAP, [])).toEqual([]);
  });
  test('accepts a scalar idpValues input and a scalar default', () => {
    expect(mapExternalRoles('cn=verifiers', MAP, [])).toEqual(['Verifier']);
    expect(mapExternalRoles('unknown', MAP, 'Assessor')).toEqual(['Assessor']);
  });
  test('tolerates empty inputs', () => {
    expect(mapExternalRoles(undefined, undefined, undefined)).toEqual([]);
  });
});

describe('parseJsonConfig', () => {
  test('parses a JSON string', () => {
    expect(parseJsonConfig('{"a":1}', {})).toEqual({ a: 1 });
  });
  test('passes through an already-parsed object', () => {
    const o = { a: 1 };
    expect(parseJsonConfig(o, {})).toBe(o);
  });
  test('falls back on empty / invalid', () => {
    expect(parseJsonConfig('', 'fb')).toBe('fb');
    expect(parseJsonConfig('not json', 'fb')).toBe('fb');
  });
});

describe('redirect-SSO gating (SAML scaffold, inert by default)', () => {
  test('password login() rejects with an actionable SSO error', async () => {
    await expect(samlProvider.login({})).rejects.toMatchObject({ code: 'AUTH_METHOD_REQUIRES_SSO' });
  });
  test('getAuthorizeUrl throws until SAML is configured + enabled', async () => {
    await expect(samlProvider.getAuthorizeUrl({ protocol: 'https', get: () => 'host' })).rejects.toBeTruthy();
  });
});

describe('external-IdP JWT verification branch (non-breaking seam)', () => {
  test('a token with authSource is trusted without a users-table lookup', async () => {
    const token = jwtUtil.sign({
      userId: null,
      username: 'ext.user',
      roles: ['Assessor'],
      email: 'ext@corp.com',
      authSource: 'ldap',
    });
    const user = await authService.authenticateUser(token);
    expect(user).toMatchObject({
      username: 'ext.user',
      roles: ['Assessor'],
      authSource: 'ldap',
      id: null,
    });
  });

  test('sessionIssuer recognizes the external sources', () => {
    ['ldap', 'oidc', 'saml'].forEach((s) => expect(EXTERNAL_SOURCES.has(s)).toBe(true));
    expect(EXTERNAL_SOURCES.has('local')).toBe(false);
  });
});
