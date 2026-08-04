const express = require('express');
const request = require('supertest');
const { httpMethodFilter } = require('../../src/middleware/httpMethodFilter');

// Mount the middleware on a throwaway app so we can exercise it end-to-end
// through Supertest without booting the real server (no DB / Keycloak needed).
function buildApp() {
  const app = express();
  app.use(httpMethodFilter);
  app.get('/ping', (req, res) => res.json({ ok: true }));
  return app;
}

describe('httpMethodFilter middleware', () => {
  const app = buildApp();

  test('allows a normal GET request through', async () => {
    const res = await request(app).get('/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('rejects TRACE with 405 and an Allow header', async () => {
    const res = await request(app).trace('/ping');
    expect(res.status).toBe(405);
    expect(res.headers.allow).toContain('GET');
  });
});
