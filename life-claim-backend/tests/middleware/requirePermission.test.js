// Tests for the opt-in requirePermission middleware (roadmap 1.1).
//
// Mounts it on a throwaway express app via Supertest (same approach as
// httpMethodFilter.test.js) with a tiny stub that injects req.user, and seeds
// the RBAC service snapshot in-memory so no DB is needed.

const express = require('express');
const request = require('supertest');
const requirePermission = require('../../src/middleware/requirePermission');
const rbacService = require('../../src/services/rbacService');

function seedRbac() {
  rbacService.__setSnapshotForTests({
    roles: [{ ID: 1, ROLE_KEY: 'assessor', ROLE_NAME: 'Assessor', IS_ENABLED: 1 }],
    permissions: [
      { ID: 10, PERMISSION_KEY: 'claims.view', IS_ENABLED: 1 },
      { ID: 11, PERMISSION_KEY: 'claims.edit', IS_ENABLED: 1 },
    ],
    rolePermissions: [{ ROLE_ID: 1, PERMISSION_ID: 10, IS_ENABLED: 1 }],
  });
}

// Build an app whose /thing route requires `perm`, with req.user taken from
// the x-user header (JSON) so each test can set its own identity.
function buildApp(perm) {
  const app = express();
  app.use((req, res, next) => {
    const raw = req.headers['x-user'];
    if (raw) req.user = JSON.parse(raw);
    next();
  });
  app.get('/thing', requirePermission(perm), (req, res) => res.json({ ok: true }));
  return app;
}

const asUser = (user) => JSON.stringify(user);

describe('requirePermission middleware', () => {
  beforeEach(seedRbac);

  test('401 when no user is present', async () => {
    const res = await request(buildApp('claims.view')).get('/thing');
    expect(res.status).toBe(401);
  });

  test('200 when the user holds the permission', async () => {
    const res = await request(buildApp('claims.view'))
      .get('/thing')
      .set('x-user', asUser({ username: 'a1', roles: ['Assessor'] }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('403 when the user lacks the permission', async () => {
    const res = await request(buildApp('claims.edit'))
      .get('/thing')
      .set('x-user', asUser({ username: 'a1', roles: ['Assessor'] }));
    expect(res.status).toBe(403);
  });

  test('superuser bypasses the check entirely', async () => {
    const res = await request(buildApp('claims.edit'))
      .get('/thing')
      .set('x-user', asUser({ username: 'root', roles: ['superuser'] }));
    expect(res.status).toBe(200);
  });

  test('superuser-by-username bypasses even without the role', async () => {
    const res = await request(buildApp('claims.edit'))
      .get('/thing')
      .set('x-user', asUser({ username: 'superuser', roles: [] }));
    expect(res.status).toBe(200);
  });

  test('fine-grained split: a role with claims.view but not claims.edit is blocked on claims.edit', async () => {
    // Mirrors the 1.5 follow-on: /update-ass moved from claims.search/view to
    // claims.edit, so a role granted only the "view" perm can no longer edit.
    const user = asUser({ username: 'a1', roles: ['Assessor'] });
    const viewRes = await request(buildApp('claims.view')).get('/thing').set('x-user', user);
    expect(viewRes.status).toBe(200); // has claims.view
    const editRes = await request(buildApp('claims.edit')).get('/thing').set('x-user', user);
    expect(editRes.status).toBe(403); // claims.edit not mapped to Assessor in the seed
  });

  test('reads roles from req.kauth when req.user is absent (bare protect() path)', async () => {
    // Simulates the Keycloak-token path where protect() populates only req.kauth.
    const app = express();
    app.use((req, res, next) => {
      const raw = req.headers['x-kauth'];
      if (raw) {
        const { username, roles } = JSON.parse(raw);
        req.kauth = {
          grant: {
            access_token: {
              content: { preferred_username: username, realm_access: { roles } },
            },
          },
        };
      }
      next();
    });
    app.get('/thing', requirePermission('claims.view'), (req, res) => res.json({ ok: true }));

    const ok = await request(app)
      .get('/thing')
      .set('x-kauth', JSON.stringify({ username: 'a1', roles: ['Assessor'] }));
    expect(ok.status).toBe(200);

    const denied = await request(app)
      .get('/thing')
      .set('x-kauth', JSON.stringify({ username: 'x1', roles: ['Verifier'] }));
    expect(denied.status).toBe(403); // Verifier not in this test's seeded snapshot
  });

  test('grants when the user holds ANY of several required permissions', async () => {
    const app = express();
    app.use((req, res, next) => {
      const raw = req.headers['x-user'];
      if (raw) req.user = JSON.parse(raw);
      next();
    });
    app.get('/multi', requirePermission('claims.edit', 'claims.view'), (req, res) => res.json({ ok: true }));
    const res = await request(app)
      .get('/multi')
      .set('x-user', asUser({ username: 'a1', roles: ['Assessor'] }));
    expect(res.status).toBe(200);
  });
});
