// src/util/pii.js
//
// PII masking / redaction utilities (roadmap 4.6). Claims data is highly sensitive
// (names, mobiles, emails, PAN/Aadhaar, bank accounts). Use these to mask PII in
// logs, error details, exports and non-privileged responses. They never throw and
// pass through empty/short values safely.

const KEEP = (s, n) => String(s).slice(-n);

/** a***@domain.com */
function maskEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at <= 0) return s ? '***' : '';
  const name = s.slice(0, at);
  const domain = s.slice(at);
  const head = name[0];
  return `${head}${'*'.repeat(Math.max(2, name.length - 1))}${domain}`;
}

/** ******7890 (last 4 kept) */
function maskMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length <= 4) return digits ? '****' : '';
  return `${'*'.repeat(digits.length - 4)}${KEEP(digits, 4)}`;
}

/** ABC***** 890F style — keep 2 head + last 2 for PAN (10 chars). */
function maskPan(pan) {
  const s = String(pan || '').toUpperCase();
  if (s.length < 4) return s ? '****' : '';
  return `${s.slice(0, 2)}${'*'.repeat(s.length - 4)}${s.slice(-2)}`;
}

/** ********1234 — Aadhaar: keep last 4 only. */
function maskAadhaar(aadhaar) {
  const digits = String(aadhaar || '').replace(/\D/g, '');
  if (digits.length < 4) return digits ? '****' : '';
  return `${'*'.repeat(digits.length - 4)}${KEEP(digits, 4)}`;
}

/** Bank/account: keep last 4. */
function maskAccount(acc) {
  const s = String(acc || '');
  if (s.length <= 4) return s ? '****' : '';
  return `${'*'.repeat(s.length - 4)}${KEEP(s, 4)}`;
}

/** Name: first initial + surname initials. "Ravi Sharma" -> "R. S." */
function maskName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.map((p) => `${p[0].toUpperCase()}.`).join(' ');
}

/** Generic: keep first + last char. */
function maskGeneric(value) {
  const s = String(value ?? '');
  if (s.length <= 2) return s ? '**' : '';
  return `${s[0]}${'*'.repeat(s.length - 2)}${s[s.length - 1]}`;
}

// Default field→masker map (by common key names, case-insensitive substring).
const DEFAULT_RULES = [
  { test: /email/i, fn: maskEmail },
  { test: /(mobile|phone|whatsapp|contact.*no)/i, fn: maskMobile },
  { test: /aadhaar|aadhar|uid/i, fn: maskAadhaar },
  { test: /pan(no|num|card)?$/i, fn: maskPan },
  { test: /(account|acct|ifsc.*acc|bank.*no)/i, fn: maskAccount },
  { test: /(^name$|fullname|claimantname|laname|nomineename|payeename)/i, fn: maskName },
];

/**
 * Return a deep copy of an object with PII fields masked (for logging/exports).
 * @param {object} obj
 * @param {object} [opts] { rules: [{test,fn}], extraKeys: {KEY: fn} }
 */
function redact(obj, opts = {}) {
  const rules = opts.rules || DEFAULT_RULES;
  const extra = opts.extraKeys || {};
  const seen = new WeakSet();

  const walk = (val) => {
    if (val == null) return val;
    if (Array.isArray(val)) return val.map(walk);
    if (typeof val === 'object') {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        if (v && typeof v === 'object') { out[k] = walk(v); continue; }
        if (extra[k]) { out[k] = extra[k](v); continue; }
        const rule = rules.find((r) => r.test.test(k));
        out[k] = rule ? rule.fn(v) : v;
      }
      return out;
    }
    return val;
  };
  return walk(obj);
}

module.exports = {
  maskEmail, maskMobile, maskPan, maskAadhaar, maskAccount, maskName, maskGeneric, redact,
};
