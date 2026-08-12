// oidcProvider — resource-owner-password flow with axios mocked (roadmap 1.4).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-1_4-auth';

jest.mock('axios');
jest.mock('../../src/services/recaptchaService', () => ({
  verifyRecaptchaToken: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/auth/sessionIssuer', () => ({
  issueExternalSession: jest.fn().mockResolvedValue({ tokenResponse: { access_token: 't' }, userProfile: {} }),
  EXTERNAL_SOURCES: new Set(['ldap', 'oidc', 'saml']),
}));
jest.mock('../../src/config/configService', () => ({ get: jest.fn((k, d) => d) }));

const axios = require('axios');
const jwt = require('jsonwebtoken');
const appConfig = require('../../src/config/configService');
const { issueExternalSession } = require('../../src/auth/sessionIssuer');
const oidcProvider = require('../../src/auth/providers/oidcProvider');

function configure(overrides = {}) {
  const MAP = {
    OIDC_TOKEN_ENDPOINT: 'https://idp/token',
    OIDC_CLIENT_ID: 'life-claims',
    OIDC_SCOPE: 'openid profile email',
    OIDC_USERNAME_CLAIM: 'preferred_username',
    OIDC_ROLE_CLAIM: 'groups',
    OIDC_ROLE_MAP: '{"claims-assessor":["Assessor"]}',
    OIDC_DEFAULT_ROLES: '[]',
    ...overrides,
  };
  appConfig.get.mockImplementation((k, d) => (MAP[k] !== undefined ? MAP[k] : d));
}

// A signable id_token (oidcProvider uses jwt.decode → signature not checked).
const idToken = (claims) => jwt.sign(claims, 'irrelevant');

const call = () => oidcProvider.login({ username: 'jdoe', password: 'pw', captchaToken: 'c', req: { ip: '1.1.1.1', get: () => 'a' }, res: { cookie: jest.fn() } });

describe('oidcProvider.login', () => {
  beforeEach(() => configure());

  test('valid ROPC → maps claim to roles and issues a session', async () => {
    axios.post.mockResolvedValueOnce({
      data: { id_token: idToken({ preferred_username: 'jdoe', email: 'jdoe@corp.com', groups: ['claims-assessor'] }) },
    });
    await call();
    expect(issueExternalSession).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'oidc', username: 'jdoe', roles: ['Assessor'], email: 'jdoe@corp.com' })
    );
  });

  test('discovers the token endpoint from OIDC_ISSUER when not explicit', async () => {
    configure({ OIDC_TOKEN_ENDPOINT: undefined, OIDC_ISSUER: 'https://idp' });
    axios.get.mockResolvedValueOnce({ data: { token_endpoint: 'https://idp/oauth/token' } });
    axios.post.mockResolvedValueOnce({ data: { id_token: idToken({ preferred_username: 'jdoe', groups: [] }) } });
    await call();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/.well-known/openid-configuration'), expect.any(Object));
    expect(axios.post).toHaveBeenCalledWith('https://idp/oauth/token', expect.any(String), expect.any(Object));
  });

  test('invalid credentials (IdP 401) → 401', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(call()).rejects.toMatchObject({ status: 401 });
    expect(issueExternalSession).not.toHaveBeenCalled();
  });

  test('IdP unreachable → 503', async () => {
    axios.post.mockRejectedValueOnce({ code: 'ECONNREFUSED' });
    await expect(call()).rejects.toMatchObject({ status: 503 });
  });

  test('not configured (no client id) → 501', async () => {
    configure({ OIDC_CLIENT_ID: undefined });
    await expect(call()).rejects.toMatchObject({ status: 501, code: 'AUTH_NOT_CONFIGURED' });
  });

  test('supports a dotted role claim path (realm_access.roles)', async () => {
    configure({ OIDC_ROLE_CLAIM: 'realm_access.roles', OIDC_ROLE_MAP: '{"assessor":["Assessor"]}' });
    axios.post.mockResolvedValueOnce({
      data: { id_token: idToken({ preferred_username: 'jdoe', realm_access: { roles: ['assessor'] } }) },
    });
    await call();
    expect(issueExternalSession).toHaveBeenCalledWith(expect.objectContaining({ roles: ['Assessor'] }));
  });
});
