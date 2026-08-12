// Unit tests for the pluggable-auth method resolver + provider registry (1.4).

const ORIGINAL = process.env.AUTH_METHOD;
const {
  getAuthMethod,
  isFormLogin,
  isRedirect,
  usesProvider,
  METHODS,
} = require('../../src/auth/authMethod');
const { getProvider, PROVIDERS } = require('../../src/auth/providers');

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AUTH_METHOD;
  else process.env.AUTH_METHOD = ORIGINAL;
});

describe('getAuthMethod (config → env → default)', () => {
  test('defaults to hybrid when unset', () => {
    delete process.env.AUTH_METHOD;
    expect(getAuthMethod()).toBe('hybrid');
  });
  test('reads and normalizes the env value', () => {
    process.env.AUTH_METHOD = '  LOCAL ';
    expect(getAuthMethod()).toBe('local');
  });
  test('falls back to hybrid on an unknown value', () => {
    process.env.AUTH_METHOD = 'banana';
    expect(getAuthMethod()).toBe('hybrid');
  });
});

describe('method classification', () => {
  test('hybrid + keycloak do NOT use the provider registry (existing path)', () => {
    expect(usesProvider('hybrid')).toBe(false);
    expect(usesProvider('keycloak')).toBe(false);
  });
  test('local/ldap/oidc/saml use the provider registry', () => {
    ['local', 'ldap', 'oidc', 'saml'].forEach((m) => expect(usesProvider(m)).toBe(true));
  });
  test('saml is redirect-based; the rest are form logins', () => {
    expect(isRedirect('saml')).toBe(true);
    ['hybrid', 'keycloak', 'local', 'ldap', 'oidc'].forEach((m) => {
      expect(isRedirect(m)).toBe(false);
      expect(isFormLogin(m)).toBe(true);
    });
  });
  test('helpers work with no argument (default to the resolved method)', () => {
    process.env.AUTH_METHOD = 'saml';
    expect(isRedirect()).toBe(true);
    expect(isFormLogin()).toBe(false);
    expect(usesProvider()).toBe(true);
    process.env.AUTH_METHOD = 'hybrid';
    expect(isRedirect()).toBe(false);
    expect(isFormLogin()).toBe(true);
    expect(usesProvider()).toBe(false);
  });
  test('METHODS constant is complete', () => {
    expect(Object.values(METHODS).sort()).toEqual(
      ['hybrid', 'keycloak', 'ldap', 'local', 'oidc', 'saml']
    );
  });
});

describe('provider registry', () => {
  test('exposes a login() for each provider-backed method', () => {
    ['local', 'ldap', 'oidc', 'saml'].forEach((m) => {
      expect(typeof getProvider(m).login).toBe('function');
    });
  });
  test('saml provider is flagged redirect and exposes SSO hooks', () => {
    const saml = getProvider('saml');
    expect(saml.redirect).toBe(true);
    expect(typeof saml.getAuthorizeUrl).toBe('function');
    expect(typeof saml.handleCallback).toBe('function');
  });
  test('unknown method throws', () => {
    expect(() => getProvider('nope')).toThrow();
  });
  test('hybrid/keycloak are intentionally absent from the registry', () => {
    expect(PROVIDERS.hybrid).toBeUndefined();
    expect(PROVIDERS.keycloak).toBeUndefined();
  });
});
