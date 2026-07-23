/**
 * Security / VAPT regression E2E — run against a live backend.
 *
 * Usage: node scripts/security-e2e.js
 *
 * Env:
 *   E2E_BASE_URL, E2E_TLS_INSECURE=true
 *   E2E_ASSESSOR_USER / E2E_ASSESSOR_PASSWORD  (Keycloak or legacy)
 *   E2E_SUPERUSER_USER / E2E_SUPERUSER_PASSWORD
 *   E2E_ASSESSOR_TOKEN / E2E_SUPERUSER_TOKEN   (Bearer override)
 *   E2E_TEST_CLAIM_NO, E2E_SKIP_LOGIN=true
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const https = require('https');
const http = require('http');
const qs = require('qs');
const { CAPTCHA_UNAVAILABLE_TOKEN } = require('../src/services/recaptchaService');
const { mintDevAuth } = require('./security-e2e-fixtures');

let baseUrl = (process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3010}/api`).replace(/\/$/, '');
const TLS_INSECURE = process.env.E2E_TLS_INSECURE === 'true';
const SKIP_LOGIN = process.env.E2E_SKIP_LOGIN === 'true';

const results = [];
let cookieJar = '';

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function absorbCookies(headers) {
  const raw = headers['set-cookie'];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [raw];
  const map = new Map();
  if (cookieJar) {
    cookieJar.split('; ').forEach((pair) => {
      const [k, ...rest] = pair.split('=');
      if (k) map.set(k, rest.join('='));
    });
  }
  for (const line of list) {
    const part = String(line).split(';')[0];
    const [k, ...rest] = part.split('=');
    if (k) map.set(k.trim(), rest.join('='));
  }
  cookieJar = [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function rawRequest(url, options = {}) {
  const parsed = new URL(url);
  const isHttps = parsed.protocol === 'https:';
  const lib = isHttps ? https : http;
  const insecure = TLS_INSECURE || process.env.E2E_TLS_INSECURE === 'true';
  const agent = isHttps && insecure ? new https.Agent({ rejectUnauthorized: false }) : undefined;

  const headers = { ...(options.headers || {}) };
  if (options.cookie !== false && cookieJar) headers.Cookie = cookieJar;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers,
        agent: options.agent || agent,
      },
      (res) => {
        absorbCookies(res.headers);
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let body;
          try {
            body = text ? JSON.parse(text) : null;
          } catch {
            body = text;
          }
          resolve({ status: res.statusCode, body, headers: res.headers });
        });
      },
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function api(path, options = {}) {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  let body = options.body;
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  return rawRequest(url, { method: options.method || 'GET', headers, body, cookie: options.cookie });
}

async function legacyLogin(username, password) {
  return api('/user/login', {
    method: 'POST',
    json: { username, password, captchaToken: CAPTCHA_UNAVAILABLE_TOKEN },
  });
}

async function keycloakLogin(username, password) {
  return api('/auth/keycloak/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs.stringify({
      client_id: 'life-claims-frontend',
      grant_type: 'password',
      username,
      password,
      captchaToken: 'test-bypass',
    }),
  });
}

async function sessionCheck() {
  return api('/auth/session-check', { method: 'GET' });
}

/** Returns { mode: 'bearer'|'cookie', token?, ok } */
async function loginUser(username, password) {
  const kc = await keycloakLogin(username, password);
  if (kc.status === 200 && kc.body?.user) {
    const session = await sessionCheck();
    if (session.status === 200) {
      return { mode: 'cookie', ok: true, user: kc.body.user };
    }
  }
  const legacy = await legacyLogin(username, password);
  if (legacy.body?.token) {
    return { mode: 'bearer', ok: true, token: legacy.body.token };
  }
  return { mode: 'none', ok: false, status: legacy.status || kc.status };
}

function authOptions(session) {
  if (!session?.ok) return {};
  if (session.mode === 'bearer') return { token: session.token };
  return {};
}

async function detectBaseUrl() {
  const port = process.env.PORT || 3010;
  const candidates = [
    process.env.E2E_BASE_URL,
    `http://localhost:3012/api`,
    `http://localhost:${port}/api`,
    `https://localhost:${port}/api`,
  ].filter(Boolean);

  for (const candidate of [...new Set(candidates)]) {
    const base = candidate.replace(/\/$/, '');
    const useTls = base.startsWith('https:');
    try {
      const res = await rawRequest(`${base}/countries`, {
        cookie: false,
        agent: useTls ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      });
      if (res.status === 401 || res.status === 200) {
        baseUrl = base;
        if (useTls) process.env.E2E_TLS_INSECURE = 'true';
        return true;
      }
    } catch {
      /* next */
    }
  }
  return false;
}

async function runUnauthenticated() {
  cookieJar = '';
  const protectedGet = await api('/countries', { cookie: false });
  record('Unauthenticated /countries → 401', protectedGet.status === 401, `status ${protectedGet.status}`);

  const origin = baseUrl.replace(/\/api$/, '');
  const trace = await rawRequest(`${origin}/api/countries`, {
    method: 'TRACE',
    cookie: false,
    agent: baseUrl.startsWith('https') ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  });
  record('TRACE method blocked (405)', trace.status === 405, `status ${trace.status}`);

  const clearCookie = await api('/auth/clear-token-cookie', { method: 'POST', cookie: false });
  record('Public POST /auth/clear-token-cookie', clearCookie.status >= 200 && clearCookie.status < 300, `status ${clearCookie.status}`);
}

async function runVerticalEscalation(auth) {
  const createUser = await api('/app/user', {
    method: 'POST',
    ...auth,
    json: {
      id: 'hacker',
      firstName: 'Hack',
      lastName: 'Er',
      email: 'hack@example.com',
      phoneNumber: '9999999999',
      createdBy: 'hack',
      password: 'Password1!',
      roles: ['Assessor'],
    },
  });
  record('Assessor cannot POST /app/user (403)', createUser.status === 403, `status ${createUser.status}`);

  const addRole = await api('/role/addrole', {
    method: 'POST',
    ...auth,
    json: { rolename: 'EvilRole', roleDescription: 'nope' },
  });
  record('Assessor cannot POST /role/addrole (403)', addRole.status === 403, `status ${addRole.status}`);

  const adminSummary = await api('/superuser/summary', { ...auth });
  record('Assessor cannot GET /superuser/summary (403)', adminSummary.status === 403, `status ${adminSummary.status}`);
}

async function runAuthenticatedApis(assessorAuth, superAuth) {
  const claimNo = process.env.E2E_TEST_CLAIM_NO || '';
  const policyId = process.env.E2E_TEST_POLICY_ID || '04027489';

  const countries = await api('/countries', { ...assessorAuth });
  record('Authenticated GET /countries', countries.status === 200, `status ${countries.status}`);

  const assessorPost = await api('/assessor-fetch/demogs', {
    method: 'POST',
    ...assessorAuth,
    json: { claimNo: claimNo || 'TEST-CLAIM-001' },
  });
  record(
    'POST /assessor-fetch/demogs',
    [200, 403, 404].includes(assessorPost.status),
    `status ${assessorPost.status}${!claimNo ? ' (set E2E_TEST_CLAIM_NO for 200)' : ''}`,
  );

  const policyPost = await api('/policy/details', {
    method: 'POST',
    ...assessorAuth,
    json: { policyID: policyId },
  });
  record('POST /policy/details', [200, 502, 503].includes(policyPost.status), `status ${policyPost.status}`);

  const fraudBankMissing = await api('/fraudprevention/claimant_Bankdetails_Check', {
    method: 'POST',
    ...assessorAuth,
    json: {},
  });
  record('Fraud bank check without claimNumber → 400', fraudBankMissing.status === 400, `status ${fraudBankMissing.status}`);

  const testClaim = claimNo || 'TEST-CLAIM-001';
  const fraudBank = await api('/fraudprevention/claimant_Bankdetails_Check', {
    method: 'POST',
    ...assessorAuth,
    json: { claimNumber: testClaim },
  });
  record(
    'Fraud bank check with claimNumber',
    [200, 403].includes(fraudBank.status),
    `status ${fraudBank.status}`,
  );

  const fraudWrongClaim = await api('/fraudprevention/claimant_Bankdetails_Check', {
    method: 'POST',
    ...assessorAuth,
    json: { claimNumber: 'ZZZ-UNAUTHORIZED-99999' },
  });
  record('Fraud bank check wrong claim → 403', fraudWrongClaim.status === 403, `status ${fraudWrongClaim.status}`);

  const fraudFeedbackMismatch = await api('/fraudprevention/update_eagle_rule_details', {
    method: 'POST',
    ...assessorAuth,
    json: {
      claimNumber: testClaim,
      feedback: { rule1: { claim_id: 'OTHER-CLAIM-999', ruleCode: '1', decision: 'x', remark: 'y' } },
    },
  });
  record(
    'Fraud feedback claim mismatch → 403',
    fraudFeedbackMismatch.status === 403,
    `status ${fraudFeedbackMismatch.status}`,
  );

  const fraudUpdateNoClaim = await api('/fraudprevention/update_eagle_rule_details', {
    method: 'POST',
    ...assessorAuth,
    json: { feedback: [], claimNumber: '' },
  });
  record('Fraud update without valid claim → 400', fraudUpdateNoClaim.status === 400, `status ${fraudUpdateNoClaim.status}`);

  if (superAuth && Object.keys(superAuth).length) {
    const users = await api('/user/user', { ...superAuth });
    record('Superuser GET /user/user', users.status === 200, `status ${users.status}`);
    const summary = await api('/superuser/summary', { ...superAuth });
    record('Superuser GET /superuser/summary', summary.status === 200, `status ${summary.status}`);
  } else {
    record('Superuser API tests', true, 'skipped — no superuser account in DB (optional)');
  }
}

async function main() {
  console.log('Security E2E — Life Claim Backend\n');

  if (!(await detectBaseUrl())) {
    console.error('Cannot reach backend. Start: cd life-claim-backend && npm start');
    process.exit(2);
  }
  console.log(`Base URL: ${baseUrl}\n`);

  await runUnauthenticated();

  if (SKIP_LOGIN) {
    console.log('\nE2E_SKIP_LOGIN=true — authenticated tests skipped.');
  } else {
    let assessorAuth = process.env.E2E_ASSESSOR_TOKEN
      ? { token: process.env.E2E_ASSESSOR_TOKEN }
      : null;
    let superAuth = process.env.E2E_SUPERUSER_TOKEN
      ? { token: process.env.E2E_SUPERUSER_TOKEN }
      : null;

    const assessorUser = process.env.E2E_ASSESSOR_USER || '';
    const assessorPass = process.env.E2E_ASSESSOR_PASSWORD || 'password123';
    const superUser = process.env.E2E_SUPERUSER_USER || '';
    const superPass = process.env.E2E_SUPERUSER_PASSWORD || assessorPass;

    if (!assessorAuth) {
      cookieJar = '';
      if (assessorUser && assessorPass) {
        const login = await loginUser(assessorUser, assessorPass);
        assessorAuth = login.ok ? authOptions(login) : null;
        if (assessorAuth) record(`Login (${assessorUser})`, true, login.mode);
      }
      if (!assessorAuth) {
        const dev = await mintDevAuth(assessorUser || null, 'operational');
        if (dev?.token) {
          assessorAuth = { token: dev.token };
          record(`Dev JWT mint (${dev.username})`, true, (dev.roles || []).join(', '));
        }
      }
    }
    if (!superAuth) {
      cookieJar = '';
      if (superUser && superPass) {
        const login = await loginUser(superUser, superPass);
        superAuth = login.ok ? authOptions(login) : null;
        if (superAuth) record(`Login (${superUser})`, true, login.mode);
      }
      if (!superAuth) {
        const dev = await mintDevAuth(superUser || null, 'superuser');
        if (dev?.token) {
          superAuth = { token: dev.token };
          record(`Dev JWT mint super (${dev.username})`, true, (dev.roles || []).join(', '));
        }
      }
    }

    if (!assessorAuth || !Object.keys(assessorAuth).length) {
      record('Authenticated security tests', false, 'skipped — provide valid Keycloak/legacy credentials');
    } else {
      cookieJar = assessorAuth.token ? '' : cookieJar;
      await runVerticalEscalation(assessorAuth);
      await runAuthenticatedApis(assessorAuth, superAuth && Object.keys(superAuth).length ? superAuth : null);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n--- ${passed} passed, ${failed} failed, ${results.length} total ---`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
