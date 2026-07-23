/**
 * Smoke-test admin APIs (needs running backend + admin token).
 * Usage: ADMIN_TOKEN=eyJ... node scripts/test-admin-apis.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const BASE = process.env.ADMIN_TEST_BASE || `http://localhost:${process.env.PORT || 3010}/api`;
const TOKEN = process.env.ADMIN_TOKEN;

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function main() {
  if (!TOKEN) {
    console.log('Skip: set ADMIN_TOKEN env var (login as admin, copy JWT)');
    process.exit(0);
  }
  const tests = [
    ['GET /admin/summary', () => req('/admin/summary')],
    ['GET /admin/claims/recent?view=openByRole', () => req('/admin/claims/recent?limit=5&view=openByRole')],
    ['GET /admin/audit', () => req('/admin/audit?limit=5')],
    ['GET /admin/audit/tracked-users', () => req('/admin/audit/tracked-users')],
    ['GET /user/user', () => req('/user/user')],
  ];
  for (const [name, fn] of tests) {
    try {
      const { status, body } = await fn();
      const ok = status >= 200 && status < 300;
      console.log(ok ? 'OK' : 'FAIL', status, name);
      if (!ok) console.log(' ', typeof body === 'object' ? body.message || body : body);
      else if (name.includes('summary')) console.log('  totalClaims:', body.totalClaims);
      else if (name.includes('audit') && Array.isArray(body)) console.log('  rows:', body.length, body[0] ? Object.keys(body[0]).join(',') : '');
      else if (Array.isArray(body)) console.log('  rows:', body.length);
    } catch (e) {
      console.log('ERR', name, e.message);
    }
  }
}

main();
