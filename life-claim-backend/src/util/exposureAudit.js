// src/util/exposureAudit.js
//
// Service-exposure / segmentation self-audit (roadmap 3.7). At startup we log a
// short review of the deployment's trust boundary so an operator can see, at a
// glance, whether internal dependencies are reachable only over a private network
// and whether the public-facing hardening flags are set. It changes NO behaviour —
// it only surfaces findings (info/warn) for the ops runbook.
//
// See docs/SERVICE_EXPOSURE.md for the full internal/external matrix.

const appConfig = require('../config/configService');
const logger = require('./logger');
const { isInternalIp, DEFAULT_CIDRS } = require('../middleware/requireInternal');
const catalog = require('../config/integrationCatalog');

/** Extract a host from a URL-ish string (handles bare host:port too). */
function hostOf(endpoint) {
  if (!endpoint) return '';
  try {
    return new URL(/^[a-z]+:\/\//i.test(endpoint) ? endpoint : `http://${endpoint}`).hostname;
  } catch {
    return String(endpoint).split('/')[0].split(':')[0];
  }
}

/** Is a dependency host on a private/internal network (good for segmentation)? */
function isPrivateHost(host) {
  if (!host) return false;
  if (host === 'localhost') return true;
  return isInternalIp(host, DEFAULT_CIDRS);
}

/**
 * Produce the exposure findings (pure — no logging). Returns
 * [{ level: 'info'|'warn', area, message }].
 */
function auditExposure() {
  const findings = [];
  const isProd = appConfig.get('NODE_ENV') === 'production';

  // 1) Internal dependencies should sit on a private network (segmentation).
  for (const it of catalog.describe()) {
    const host = hostOf(it.endpoint);
    // Keycloak is a client-facing IdP; the rest are backend-only dependencies.
    const backendOnly = it.id !== 'keycloak';
    if (backendOnly && host && !isPrivateHost(host)) {
      findings.push({
        level: isProd ? 'warn' : 'info',
        area: 'segmentation',
        message: `${it.label} endpoint host "${host}" is not on a private/internal range — ensure it is reachable only via the internal network, not the public internet.`,
      });
    }
  }

  // 2) Public-facing hardening flags.
  const corsConfigured = String(appConfig.get('CORS_ALLOWED_ORIGINS', '') || '').trim().length > 0;
  if (isProd && !corsConfigured) {
    findings.push({ level: 'warn', area: 'cors', message: 'CORS_ALLOWED_ORIGINS is empty in production — set an explicit allow-list of public origins.' });
  }
  const httpsAuth = appConfig.get('REQUIRE_HTTPS_AUTH') === 'true' || isProd;
  if (!httpsAuth) {
    findings.push({ level: 'info', area: 'transport', message: 'REQUIRE_HTTPS_AUTH is off — auth endpoints accept plain HTTP (fine for local dev).' });
  }
  if (!appConfig.get('INTERNAL_API_KEY')) {
    findings.push({ level: 'info', area: 'segmentation', message: 'INTERNAL_API_KEY is unset — internal-only endpoints rely on IP allow-listing only (INTERNAL_ALLOWED_CIDRS).' });
  }

  return findings;
}

/** Run the audit and log each finding (best-effort; never throws). */
function logExposureAudit() {
  try {
    const findings = auditExposure();
    if (!findings.length) {
      logger.info('[segmentation] exposure audit: no issues found.');
      return findings;
    }
    logger.info(`[segmentation] exposure audit — ${findings.length} note(s); see docs/SERVICE_EXPOSURE.md:`);
    for (const f of findings) {
      logger.event(f.level, `[segmentation:${f.area}] ${f.message}`);
    }
    return findings;
  } catch (err) {
    logger.warn('[segmentation] exposure audit skipped:', err?.message);
    return [];
  }
}

module.exports = { auditExposure, logExposureAudit, isPrivateHost, hostOf };
