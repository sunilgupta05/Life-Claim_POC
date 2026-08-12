// sessionIssuer — mints a self-contained local JWT for external-IdP logins (1.4).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-1_4-auth';

jest.mock('../../src/util/authCookies', () => ({
  setAuthCookies: jest.fn(),
  storeAuthSession: jest.fn(),
}));
jest.mock('../../src/services/auditLogService', () => ({
  recordLogin: jest.fn().mockResolvedValue(),
}));

const jwt = require('jsonwebtoken');
const { issueExternalSession } = require('../../src/auth/sessionIssuer');
const { setAuthCookies, storeAuthSession } = require('../../src/util/authCookies');
const { recordLogin } = require('../../src/services/auditLogService');

function fakeReqRes() {
  return {
    req: { ip: '10.0.0.1', get: () => 'jest-agent' },
    res: { cookie: jest.fn() },
  };
}

describe('issueExternalSession', () => {
  test('mints a JWT carrying authSource + roles, sets cookies, records login', async () => {
    const { req, res } = fakeReqRes();
    const { tokenResponse, userProfile } = await issueExternalSession({
      source: 'ldap',
      username: 'ext.user',
      roles: ['Assessor', 'Verifier'],
      email: 'ext@corp.com',
      req,
      res,
    });

    const claims = jwt.decode(tokenResponse.access_token);
    expect(claims.authSource).toBe('ldap');
    expect(claims.username).toBe('ext.user');
    expect(claims.roles).toEqual(['Assessor', 'Verifier']);
    expect(claims.exp).toBeGreaterThan(claims.iat);

    expect(tokenResponse.token_type).toBe('Bearer');
    expect(tokenResponse.expires_in).toBeGreaterThan(0);
    expect(setAuthCookies).toHaveBeenCalledWith(res, tokenResponse);
    expect(storeAuthSession).toHaveBeenCalled();
    expect(recordLogin).toHaveBeenCalledWith(expect.objectContaining({ username: 'ext.user', roles: ['Assessor', 'Verifier'] }));

    expect(userProfile).toMatchObject({
      sub: 'ext.user',
      preferred_username: 'ext.user',
      roles: ['Assessor', 'Verifier'],
      email: 'ext@corp.com',
      authSource: 'ldap',
    });
  });

  test('rejects an unsupported source', async () => {
    const { req, res } = fakeReqRes();
    await expect(issueExternalSession({ source: 'local', username: 'x', req, res })).rejects.toThrow();
  });

  test('rejects when the IdP returned no username', async () => {
    const { req, res } = fakeReqRes();
    await expect(issueExternalSession({ source: 'oidc', username: '', req, res })).rejects.toMatchObject({ status: 502 });
  });

  test('a login-audit failure does not break session issuance', async () => {
    recordLogin.mockRejectedValueOnce(new Error('db down'));
    const { req, res } = fakeReqRes();
    const out = await issueExternalSession({ source: 'saml', username: 'u', roles: [], req, res });
    expect(out.tokenResponse.access_token).toBeTruthy();
  });
});
