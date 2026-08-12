// ldapProvider — full login flow with `ldapts` mocked (roadmap 1.4).

jest.mock('ldapts', () => {
  const bind = jest.fn().mockResolvedValue();
  const search = jest.fn();
  const unbind = jest.fn().mockResolvedValue();
  const Client = jest.fn(() => ({ bind, search, unbind }));
  return { Client, __m: { bind, search, unbind } };
});
jest.mock('../../src/services/recaptchaService', () => ({
  verifyRecaptchaToken: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/auth/sessionIssuer', () => ({
  issueExternalSession: jest.fn().mockResolvedValue({ tokenResponse: { access_token: 't' }, userProfile: {} }),
  EXTERNAL_SOURCES: new Set(['ldap', 'oidc', 'saml']),
}));
jest.mock('../../src/config/configService', () => ({ get: jest.fn((k, d) => d) }));

const appConfig = require('../../src/config/configService');
const { __m } = require('ldapts');
const { issueExternalSession } = require('../../src/auth/sessionIssuer');
const ldapProvider = require('../../src/auth/providers/ldapProvider');

const ENTRY = { dn: 'uid=jdoe,ou=people,dc=corp', memberOf: ['cn=assessors'], mail: 'jdoe@corp.com' };

function configure(overrides = {}) {
  const MAP = {
    LDAP_URL: 'ldaps://dc.corp:636',
    LDAP_SEARCH_BASE: 'ou=people,dc=corp',
    LDAP_ROLE_ATTRIBUTE: 'memberOf',
    LDAP_EMAIL_ATTRIBUTE: 'mail',
    LDAP_ROLE_MAP: '{"cn=assessors":["Assessor"]}',
    LDAP_DEFAULT_ROLES: '[]',
    ...overrides,
  };
  appConfig.get.mockImplementation((k, d) => (MAP[k] !== undefined ? MAP[k] : d));
}

const call = () => ldapProvider.login({ username: 'jdoe', password: 'pw', captchaToken: 'c', req: { ip: '1.1.1.1', get: () => 'a' }, res: { cookie: jest.fn() } });

describe('ldapProvider.login', () => {
  beforeEach(() => configure());

  test('valid credentials → maps group to roles and issues a session', async () => {
    __m.search.mockResolvedValueOnce({ searchEntries: [ENTRY] });
    __m.bind.mockResolvedValueOnce(); // user re-bind succeeds
    await call();
    expect(issueExternalSession).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'ldap', username: 'jdoe', roles: ['Assessor'], email: 'jdoe@corp.com' })
    );
  });

  test('wrong password → user bind fails → 401', async () => {
    __m.search.mockResolvedValueOnce({ searchEntries: [ENTRY] });
    __m.bind.mockRejectedValueOnce(new Error('invalidCredentials'));
    await expect(call()).rejects.toMatchObject({ status: 401 });
    expect(issueExternalSession).not.toHaveBeenCalled();
  });

  test('user not found → 401', async () => {
    __m.search.mockResolvedValueOnce({ searchEntries: [] });
    await expect(call()).rejects.toMatchObject({ status: 401 });
  });

  test('unmapped group falls back to LDAP_DEFAULT_ROLES', async () => {
    configure({ LDAP_ROLE_MAP: '{}', LDAP_DEFAULT_ROLES: '["Assessor"]' });
    __m.search.mockResolvedValueOnce({ searchEntries: [{ ...ENTRY, memberOf: ['cn=unknown'] }] });
    __m.bind.mockResolvedValueOnce();
    await call();
    expect(issueExternalSession).toHaveBeenCalledWith(expect.objectContaining({ roles: ['Assessor'] }));
  });

  test('not configured (no LDAP_URL) → 501', async () => {
    configure({ LDAP_URL: undefined });
    await expect(call()).rejects.toMatchObject({ status: 501, code: 'AUTH_NOT_CONFIGURED' });
  });

  test('missing credentials → 400', async () => {
    await expect(ldapProvider.login({ username: '', password: '', captchaToken: 'c', req: {}, res: {} }))
      .rejects.toMatchObject({ status: 400 });
  });
});
