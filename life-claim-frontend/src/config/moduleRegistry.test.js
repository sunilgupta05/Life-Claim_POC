import { describe, it, expect } from 'vitest';
import {
  MODULES,
  SUPERUSER_ONLY_NAV,
  isModuleEnabled,
  moduleGuard,
  visibleModules,
  hydrateModules,
} from './moduleRegistry';
import { SUPERUSER_ROUTE_ROLES } from '../util/superuserRole';

// Faithful stand-in for useAuth().hasRole (see AuthContext.jsx): accepts a
// string or array, treats superuser specially, normalizes -/_ and case.
function makeHasRole(roles, username = '') {
  const isSuper = (r) => ['superuser', 'super user'].includes(String(r).toLowerCase());
  const hasSuperAccess = roles.some(isSuper) || String(username).toLowerCase() === 'superuser';
  const norm = (s) => String(s || '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  return (required) => {
    const req = Array.isArray(required) ? required : [required];
    if (req.some(isSuper) && hasSuperAccess) return true;
    return req.some((r) => roles.some((ur) => norm(ur) === norm(r)));
  };
}

const ALL = MODULES.map((m) => m.id);
const ids = (list) => list.map((m) => m.id);

// The DB overlay is module-level state — reset it after every test so the
// default-behavior specs above/below always start from the registry defaults.
afterEach(() => hydrateModules([]));

describe('isModuleEnabled', () => {
  it('true when present in the list', () => {
    expect(isModuleEnabled('pool', ['dashboard', 'pool'])).toBe(true);
  });
  it('false when absent from the list', () => {
    expect(isModuleEnabled('pool', ['dashboard', 'claims'])).toBe(false);
  });
  it('treats a missing/non-array list as all-enabled (pre-hydration safety)', () => {
    expect(isModuleEnabled('pool', undefined)).toBe(true);
    expect(isModuleEnabled('pool', null)).toBe(true);
    expect(isModuleEnabled('pool', 'nonsense')).toBe(true);
  });
});

describe('moduleGuard', () => {
  it('operational module with no role → module + blockSuperUserOnly only', () => {
    expect(moduleGuard('dashboard')).toEqual({ module: 'dashboard', blockSuperUserOnly: true });
    expect(moduleGuard('claims')).toEqual({ module: 'claims', blockSuperUserOnly: true });
  });
  it('operational module with a role → carries requiredRole', () => {
    expect(moduleGuard('policy')).toEqual({ module: 'policy', requiredRole: ['Pre Assessor'], blockSuperUserOnly: true });
    expect(moduleGuard('pool')).toEqual({ module: 'pool', requiredRole: ['Assessor', 'Verifier'], blockSuperUserOnly: true });
  });
  it('superuser modules use SUPERUSER_ROUTE_ROLES and are NOT blockSuperUserOnly', () => {
    expect(moduleGuard('audit-log')).toEqual({ module: 'audit-log', requiredRole: SUPERUSER_ROUTE_ROLES });
    expect(moduleGuard('superuser-overview')).toEqual({ module: 'superuser-overview', requiredRole: SUPERUSER_ROUTE_ROLES });
    expect(moduleGuard('superuser-claims')).toEqual({ module: 'superuser-claims', requiredRole: SUPERUSER_ROUTE_ROLES });
  });
});

describe('visibleModules — reproduces today\'s nav per role (all modules enabled)', () => {
  it('Pre Assessor', () => {
    const nav = visibleModules(makeHasRole(['Pre Assessor']), false, ALL);
    expect(ids(nav)).toEqual(['dashboard', 'policy', 'claims']);
  });
  it('Assessor', () => {
    const nav = visibleModules(makeHasRole(['Assessor']), false, ALL);
    expect(ids(nav)).toEqual(['dashboard', 'claims', 'pool', 'tasks', 'add']);
  });
  it('Verifier', () => {
    const nav = visibleModules(makeHasRole(['Verifier']), false, ALL);
    expect(ids(nav)).toEqual(['dashboard', 'claims', 'pool', 'tasks', 'add']);
  });
  it('superuser-only user → only the superuser section', () => {
    const nav = visibleModules(makeHasRole(['superuser'], 'superuser'), true, ALL);
    expect(ids(nav)).toEqual(SUPERUSER_ONLY_NAV);
  });
  it('superuser WITH an operational role → superuser nav + operational nav', () => {
    const nav = visibleModules(makeHasRole(['superuser', 'Assessor']), false, ALL);
    expect(ids(nav)).toEqual([
      'dashboard', 'superuser-overview', 'superuser-claims',
      'claims', 'pool', 'tasks', 'add', 'audit-log', 'access-control',
    ]);
  });
});

describe('hydrateModules — DB overlay (roadmap 1.5)', () => {
  it('DB config overrides enabled + roles; nav reflects the admin edit', () => {
    hydrateModules([
      { key: 'add', isEnabled: true, allowedRoles: ['Verifier'] },   // was Assessor+Verifier
      { key: 'pool', isEnabled: false, allowedRoles: ['Assessor', 'Verifier'] }, // disabled
    ]);
    // Assessor loses 'add' (now Verifier-only) and 'pool' (disabled)
    expect(ids(visibleModules(makeHasRole(['Assessor']), false, ALL))).toEqual(['dashboard', 'claims', 'tasks']);
    // Verifier keeps 'add', loses 'pool'
    expect(ids(visibleModules(makeHasRole(['Verifier']), false, ALL))).toEqual(['dashboard', 'claims', 'tasks', 'add']);
  });

  it('DB enabled flag wins over the org-profile enabled list', () => {
    hydrateModules([{ key: 'claims', isEnabled: false, allowedRoles: null }]);
    expect(isModuleEnabled('claims', ALL)).toBe(false); // ALL includes it, but DB says off
  });

  it('modules absent from the DB config fall back to registry defaults', () => {
    hydrateModules([{ key: 'add', isEnabled: true, allowedRoles: ['Verifier'] }]);
    // 'pool' not in the overlay → default Assessor+Verifier still applies
    expect(ids(visibleModules(makeHasRole(['Assessor']), false, ALL))).toContain('pool');
  });

  it('moduleGuard on an operational module honors the DB role override', () => {
    hydrateModules([{ key: 'add', isEnabled: true, allowedRoles: ['Verifier'] }]);
    expect(moduleGuard('add')).toEqual({ module: 'add', requiredRole: ['Verifier'], blockSuperUserOnly: true });
  });

  it('empty/undefined overlay leaves defaults intact', () => {
    expect(hydrateModules(undefined)).toBe(false);
    expect(ids(visibleModules(makeHasRole(['Assessor']), false, ALL))).toEqual(['dashboard', 'claims', 'pool', 'tasks', 'add']);
  });
});

describe('visibleModules — module on/off switch', () => {
  it('hides a module absent from enabledModules', () => {
    const nav = visibleModules(makeHasRole(['Assessor']), false, ['dashboard', 'claims', 'pool', 'tasks']);
    expect(ids(nav)).toEqual(['dashboard', 'claims', 'pool', 'tasks']); // no "add"
  });
  it('undefined enabledModules → everything the role would normally see', () => {
    const nav = visibleModules(makeHasRole(['Assessor']), false, undefined);
    expect(ids(nav)).toEqual(['dashboard', 'claims', 'pool', 'tasks', 'add']);
  });
});
