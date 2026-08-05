const { extractKeycloakRoles, extractKeycloakUsername } = require('../../src/util/keycloakRoles');

describe('keycloakRoles', () => {
  describe('extractKeycloakRoles', () => {
    test('merges realm, client (resource_access), and top-level roles, de-duped', () => {
      const payload = {
        realm_access: { roles: ['Assessor', 'offline_access'] },
        resource_access: {
          'life-claims-frontend': { roles: ['Verifier'] },
          account: { roles: ['manage-account'] },
        },
        roles: ['Assessor', 'extra'], // Assessor is a duplicate
      };
      const roles = extractKeycloakRoles(payload);
      expect(roles).toEqual(
        expect.arrayContaining(['Assessor', 'offline_access', 'Verifier', 'manage-account', 'extra'])
      );
      // de-duplicated
      expect(roles.filter((r) => r === 'Assessor')).toHaveLength(1);
    });

    test('returns [] for an empty or malformed payload', () => {
      expect(extractKeycloakRoles({})).toEqual([]);
      expect(extractKeycloakRoles()).toEqual([]);
      expect(extractKeycloakRoles({ realm_access: null, resource_access: 'nope' })).toEqual([]);
    });

    test('drops blank / whitespace-only role names', () => {
      expect(extractKeycloakRoles({ realm_access: { roles: ['  ', '', 'Real'] } })).toEqual(['Real']);
    });
  });

  describe('extractKeycloakUsername', () => {
    test('prefers preferred_username, then username, then sub', () => {
      expect(extractKeycloakUsername({ preferred_username: 'alice', sub: '1' })).toBe('alice');
      expect(extractKeycloakUsername({ username: 'bob' })).toBe('bob');
      expect(extractKeycloakUsername({ sub: 'uuid-123' })).toBe('uuid-123');
    });
    test('returns empty string when nothing is present', () => {
      expect(extractKeycloakUsername({})).toBe('');
      expect(extractKeycloakUsername()).toBe('');
    });
  });
});
