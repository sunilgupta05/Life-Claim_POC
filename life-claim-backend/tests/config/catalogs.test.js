// tests/config/catalogs.test.js — integration + settings catalogs (roadmap 4.1).

process.env.LOG_TO_FILE = 'false';
const catalog = require('../../src/config/integrationCatalog');
const { SETTINGS, BY_KEY } = require('../../src/config/settingsCatalog');

describe('integrationCatalog', () => {
  test('describe() returns each integration with a resolved endpoint', () => {
    const items = catalog.describe();
    const ids = items.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['transaction-api', 'alfresco', 'whatsapp', 'rabbitmq', 'rules-engine', 'keycloak']));
    for (const it of items) {
      expect(it.endpoint).toBeTruthy();
      expect(it).toHaveProperty('label');
    }
  });

  test('resolveEndpoint uses the fallback when no key is set', () => {
    expect(catalog.resolveEndpoint(['DEFINITELY_UNSET_KEY_123'], 'http://fallback')).toBe('http://fallback');
  });
});

describe('settingsCatalog', () => {
  test('is a non-empty allow-list keyed by config key', () => {
    expect(SETTINGS.length).toBeGreaterThan(5);
    expect(BY_KEY.LOG_LEVEL).toMatchObject({ type: 'enum', options: expect.any(Array) });
    expect(BY_KEY.TXN_API_BASE_URL).toMatchObject({ group: 'Integration URLs' });
  });

  test('every entry has key/label/type/group', () => {
    for (const s of SETTINGS) {
      expect(s.key && s.label && s.type && s.group).toBeTruthy();
    }
  });
});
