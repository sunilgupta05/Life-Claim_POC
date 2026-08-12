// Unit tests for the dynamic RBAC resolution logic (roadmap 1.1).
//
// These exercise the pure resolver against a hand-built snapshot — no DB, no
// Keycloak — so they run fast in CI and pin the enable/disable + superuser
// semantics that later route enforcement will depend on.

const rbacService = require('../../src/services/rbacService');

// A small snapshot mirroring the rbac_* table shape (UPPERCASE columns).
function snap() {
  return {
    roles: [
      { ID: 1, ROLE_KEY: 'assessor', ROLE_NAME: 'Assessor', IS_SYSTEM: 1, IS_ENABLED: 1 },
      { ID: 2, ROLE_KEY: 'verifier', ROLE_NAME: 'Verifier', IS_SYSTEM: 1, IS_ENABLED: 1 },
      { ID: 3, ROLE_KEY: 'pre-assessor', ROLE_NAME: 'Pre Assessor', IS_SYSTEM: 1, IS_ENABLED: 1 },
      { ID: 4, ROLE_KEY: 'auditor', ROLE_NAME: 'Auditor', IS_SYSTEM: 0, IS_ENABLED: 0 }, // disabled role
    ],
    permissions: [
      { ID: 10, PERMISSION_KEY: 'claims.view', IS_ENABLED: 1 },
      { ID: 11, PERMISSION_KEY: 'claims.edit', IS_ENABLED: 1 },
      { ID: 12, PERMISSION_KEY: 'pool.assign', IS_ENABLED: 1 },
      { ID: 13, PERMISSION_KEY: 'legacy.thing', IS_ENABLED: 0 }, // disabled permission
      { ID: 14, PERMISSION_KEY: 'audit.view', IS_ENABLED: 1 },
    ],
    rolePermissions: [
      { ROLE_ID: 1, PERMISSION_ID: 10, IS_ENABLED: 1 }, // assessor -> claims.view
      { ROLE_ID: 1, PERMISSION_ID: 11, IS_ENABLED: 1 }, // assessor -> claims.edit
      { ROLE_ID: 1, PERMISSION_ID: 12, IS_ENABLED: 0 }, // assessor -> pool.assign (mapping disabled)
      { ROLE_ID: 1, PERMISSION_ID: 13, IS_ENABLED: 1 }, // assessor -> legacy.thing (perm disabled)
      { ROLE_ID: 2, PERMISSION_ID: 10, IS_ENABLED: 1 }, // verifier -> claims.view
      { ROLE_ID: 4, PERMISSION_ID: 14, IS_ENABLED: 1 }, // auditor(disabled role) -> audit.view
    ],
  };
}

const { computeEffectivePermissions } = rbacService;

describe('rbacService.computeEffectivePermissions', () => {
  test('grants a role its enabled mappings to enabled permissions', () => {
    const eff = computeEffectivePermissions(snap(), ['Assessor']);
    expect(eff.has('claims.view')).toBe(true);
    expect(eff.has('claims.edit')).toBe(true);
  });

  test('mapping-level disable hides a permission', () => {
    const eff = computeEffectivePermissions(snap(), ['Assessor']);
    expect(eff.has('pool.assign')).toBe(false); // mapping IS_ENABLED = 0
  });

  test('permission-level disable hides it even when the mapping is enabled', () => {
    const eff = computeEffectivePermissions(snap(), ['Assessor']);
    expect(eff.has('legacy.thing')).toBe(false); // permission IS_ENABLED = 0
  });

  test('role-level disable hides everything that role would grant', () => {
    const eff = computeEffectivePermissions(snap(), ['Auditor']);
    expect(eff.has('audit.view')).toBe(false); // role IS_ENABLED = 0
  });

  test('matches JWT role names to ROLE_KEY regardless of spacing/case/dashes', () => {
    // "PRE_ASSESSOR" should match the stored key "pre-assessor".
    const s = snap();
    s.rolePermissions.push({ ROLE_ID: 3, PERMISSION_ID: 10, IS_ENABLED: 1 });
    const eff = computeEffectivePermissions(s, ['PRE_ASSESSOR']);
    expect(eff.has('claims.view')).toBe(true);
  });

  test('unknown role grants nothing', () => {
    const eff = computeEffectivePermissions(snap(), ['NoSuchRole']);
    expect(eff.size).toBe(0);
  });

  test('superuser gets every ENABLED permission and no disabled ones', () => {
    const eff = computeEffectivePermissions(snap(), ['superuser']);
    expect(eff.has('claims.view')).toBe(true);
    expect(eff.has('pool.assign')).toBe(true);  // superuser ignores mapping rows
    expect(eff.has('audit.view')).toBe(true);
    expect(eff.has('legacy.thing')).toBe(false); // still respects permission disable
  });

  test('empty/unmigrated snapshot denies (no throw)', () => {
    expect(computeEffectivePermissions({}, ['Assessor']).size).toBe(0);
    expect(computeEffectivePermissions(undefined, ['Assessor']).size).toBe(0);
  });

  test('multiple roles union their permissions', () => {
    const eff = computeEffectivePermissions(snap(), ['Assessor', 'Verifier']);
    expect(eff.has('claims.view')).toBe(true);
    expect(eff.has('claims.edit')).toBe(true);
  });
});

describe('rbacService.hasPermission / permissionsForRoles (live snapshot)', () => {
  beforeEach(() => rbacService.__setSnapshotForTests(snap()));

  test('hasPermission reflects the snapshot', () => {
    expect(rbacService.hasPermission(['Assessor'], 'claims.view')).toBe(true);
    expect(rbacService.hasPermission(['Assessor'], 'pool.assign')).toBe(false);
    expect(rbacService.hasPermission(['Verifier'], 'claims.edit')).toBe(false);
  });

  test('superuser passes hasPermission for any key, even absent from catalog', () => {
    expect(rbacService.hasPermission(['superuser'], 'anything.at.all')).toBe(true);
    expect(rbacService.hasPermission(['super user'], 'claims.view')).toBe(true);
  });

  test('hasPermission is false with a missing key or no roles', () => {
    expect(rbacService.hasPermission(['Assessor'], '')).toBe(false);
    expect(rbacService.hasPermission([], 'claims.view')).toBe(false);
  });

  test('permissionsForRoles returns a Set of keys', () => {
    const set = rbacService.permissionsForRoles(['Assessor']);
    expect(set).toBeInstanceOf(Set);
    expect([...set].sort()).toEqual(['claims.edit', 'claims.view']);
  });

  test('getMatrix pairs roles with their granted permission keys', () => {
    const matrix = rbacService.getMatrix();
    const assessor = matrix.find((r) => r.key === 'assessor');
    expect(assessor).toBeTruthy();
    const keys = assessor.permissions.map((p) => p.key);
    expect(keys).toContain('claims.view');
  });
});

describe('rbacService.getModules (roadmap 1.5)', () => {
  test('maps rbac_module rows, normalizing ALLOWED_ROLES (array / null / json-string)', () => {
    rbacService.__setSnapshotForTests({
      modules: [
        { MODULE_KEY: 'claims', LABEL: 'Claim Search', PATH: '/claim-search', IS_ENABLED: 1, ALLOWED_ROLES: null, IS_SYSTEM: 1, SORT_ORDER: 50 },
        { MODULE_KEY: 'pool', LABEL: 'Pool', PATH: '/pool-selection', IS_ENABLED: 0, ALLOWED_ROLES: ['Assessor', 'Verifier'], IS_SYSTEM: 1, SORT_ORDER: 60 },
        { MODULE_KEY: 'x', LABEL: 'X', PATH: '/x', IS_ENABLED: 1, ALLOWED_ROLES: '["Assessor"]', IS_SYSTEM: 0, SORT_ORDER: 70 },
      ],
    });
    const mods = rbacService.getModules();
    expect(mods.find((m) => m.key === 'claims')).toMatchObject({ isEnabled: true, allowedRoles: null, isSystem: true });
    expect(mods.find((m) => m.key === 'pool')).toMatchObject({ isEnabled: false, allowedRoles: ['Assessor', 'Verifier'] });
    expect(mods.find((m) => m.key === 'x').allowedRoles).toEqual(['Assessor']); // json string parsed
  });

  test('empty snapshot ⇒ no modules (registry defaults apply on the frontend)', () => {
    rbacService.__setSnapshotForTests({});
    expect(rbacService.getModules()).toEqual([]);
  });
});

describe('rbacService.slugify', () => {
  test('normalizes free-text names into stable keys', () => {
    expect(rbacService.slugify('Claims Manager')).toBe('claims-manager');
    expect(rbacService.slugify('Pre Assessor')).toBe('pre-assessor');
    expect(rbacService.slugify('  Weird__Name!!  ')).toBe('weird-name');
  });
});
