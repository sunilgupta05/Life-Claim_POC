// src/middleware/requireInternal.js
//
// Trust-boundary guard (roadmap 3.7 — internal-service exposure / segmentation).
//
// Marks an endpoint as INTERNAL-only: reachable from a private network / trusted
// caller, but not from the public internet. A request is allowed when EITHER
//   (a) the client IP is in the internal allow-list (loopback + RFC-1918 private
//       ranges by default; extend/override via INTERNAL_ALLOWED_CIDRS), OR
//   (b) it carries a shared secret header `X-Internal-Api-Key` matching
//       INTERNAL_API_KEY (for authenticated service-to-service calls that cross
//       a boundary, e.g. through a gateway).
//
// This complements — not replaces — the existing auth gate; use it to add network
// segmentation to ops/service endpoints. It never grants access on its own to a
// route that also sits behind requireApiAuth.

const appConfig = require('../config/configService');
const secrets = require('../config/secrets');
const logger = require('../util/logger');

const DEFAULT_CIDRS = ['127.0.0.0/8', '::1/128', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

/** Normalize an IPv4-mapped IPv6 address (::ffff:1.2.3.4) to plain IPv4. */
function normalizeIp(ip) {
  if (!ip) return '';
  const s = String(ip).trim();
  const m = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return m ? m[1] : s;
}

/** IPv4 dotted-quad -> uint32, or null if not IPv4. */
function ipv4ToInt(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = (n << 8) + o;
  }
  return n >>> 0;
}

/** Does an IPv4 address fall inside an IPv4 CIDR? */
function ipv4InCidr(ip, cidr) {
  const [range, bitsRaw] = String(cidr).split('/');
  const bits = Number(bitsRaw);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

/** True when `ip` is inside any of the configured internal CIDRs (or is ::1). */
function isInternalIp(ip, cidrs) {
  const norm = normalizeIp(ip);
  if (norm === '::1' || norm === '127.0.0.1') return true;
  return cidrs.some((c) => (c.includes(':') ? norm === c.split('/')[0] : ipv4InCidr(norm, c)));
}

function configuredCidrs() {
  const raw = String(appConfig.get('INTERNAL_ALLOWED_CIDRS', '') || '').trim();
  if (!raw) return DEFAULT_CIDRS;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_CIDRS;
}

/**
 * Express middleware factory. Options:
 *   allowApiKey (default true) — also accept a matching X-Internal-Api-Key.
 */
function requireInternal(options = {}) {
  const allowApiKey = options.allowApiKey !== false;
  return (req, res, next) => {
    const cidrs = configuredCidrs();
    const clientIp = req.ip || req.connection?.remoteAddress || '';

    if (isInternalIp(clientIp, cidrs)) return next();

    if (allowApiKey) {
      const key = secrets.get('INTERNAL_API_KEY');
      const provided = req.headers['x-internal-api-key'];
      if (key && provided && String(provided) === String(key)) return next();
    }

    logger.warn(`[segmentation] blocked external access to internal route ${req.method} ${req.originalUrl} from ${normalizeIp(clientIp)}`);
    return res.status(403).json({ message: 'This endpoint is restricted to internal callers.', code: 'FORBIDDEN' });
  };
}

module.exports = { requireInternal, isInternalIp, ipv4InCidr, normalizeIp, DEFAULT_CIDRS };
