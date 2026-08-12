// samlProvider — redirect SSO with @node-saml/node-saml mocked (roadmap 1.4).

jest.mock('@node-saml/node-saml', () => {
  const getAuthorizeUrlAsync = jest.fn();
  const validatePostResponseAsync = jest.fn();
  const SAML = jest.fn(() => ({ getAuthorizeUrlAsync, validatePostResponseAsync }));
  return { SAML, __m: { getAuthorizeUrlAsync, validatePostResponseAsync } };
});
jest.mock('../../src/auth/sessionIssuer', () => ({
  issueExternalSession: jest.fn().mockResolvedValue({ tokenResponse: { access_token: 't' }, userProfile: {} }),
  EXTERNAL_SOURCES: new Set(['ldap', 'oidc', 'saml']),
}));
jest.mock('../../src/config/configService', () => ({ get: jest.fn((k, d) => d) }));

const appConfig = require('../../src/config/configService');
const { __m } = require('@node-saml/node-saml');
const { issueExternalSession } = require('../../src/auth/sessionIssuer');
const samlProvider = require('../../src/auth/providers/samlProvider');

function configure(overrides = {}) {
  const MAP = {
    SAML_ENABLED: 'true',
    SAML_ENTRY_POINT: 'https://idp/sso',
    SAML_ISSUER: 'life-claims-sp',
    SAML_CALLBACK_URL: 'https://app/api/auth/sso/callback',
    SAML_IDP_CERT: 'CERT',
    SAML_ROLE_ATTRIBUTE: 'groups',
    SAML_ROLE_MAP: '{"saml-assessors":["Verifier"]}',
    SAML_DEFAULT_ROLES: '[]',
    ...overrides,
  };
  appConfig.get.mockImplementation((k, d) => (MAP[k] !== undefined ? MAP[k] : d));
}

const reqStub = { protocol: 'https', get: () => 'app', body: { SAMLResponse: 'xyz' } };

describe('samlProvider (enabled + configured)', () => {
  beforeEach(() => configure());

  test('getAuthorizeUrl returns the IdP redirect URL', async () => {
    __m.getAuthorizeUrlAsync.mockResolvedValueOnce('https://idp/sso?SAMLRequest=abc');
    const url = await samlProvider.getAuthorizeUrl(reqStub);
    expect(url).toBe('https://idp/sso?SAMLRequest=abc');
  });

  test('handleCallback validates the assertion, maps roles, issues a session', async () => {
    __m.validatePostResponseAsync.mockResolvedValueOnce({
      profile: { nameID: 'jdoe', email: 'jdoe@corp.com', groups: ['saml-assessors'] },
    });
    await samlProvider.handleCallback(reqStub, { cookie: jest.fn() });
    expect(issueExternalSession).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'saml', username: 'jdoe', roles: ['Verifier'], email: 'jdoe@corp.com' })
    );
  });

  test('password login() is not applicable → SSO error', async () => {
    await expect(samlProvider.login({})).rejects.toMatchObject({ code: 'AUTH_METHOD_REQUIRES_SSO' });
  });
});

describe('samlProvider gating', () => {
  test('disabled (SAML_ENABLED!=true) → clear config error', async () => {
    configure({ SAML_ENABLED: 'false' });
    await expect(samlProvider.getAuthorizeUrl(reqStub)).rejects.toMatchObject({ code: 'AUTH_METHOD_REQUIRES_SSO' });
  });

  test('enabled but missing a required key → config error', async () => {
    configure({ SAML_ENTRY_POINT: undefined });
    await expect(samlProvider.getAuthorizeUrl(reqStub)).rejects.toMatchObject({ status: 501 });
  });
});
