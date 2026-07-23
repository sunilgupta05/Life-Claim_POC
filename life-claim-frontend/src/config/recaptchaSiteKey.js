import { readEnv } from '../util/env'

/** Google reCAPTCHA v2 test site key (pairs with backend test secret). */
export const GOOGLE_RECAPTCHA_TEST_SITE_KEY =
  '6LeIxAcTAAAAAJcZVRqyHhUHMR1l1FMuNTMvMr8L'

// Fingerprints (not the plaintext) of known-bad values that must never be used as the
// site key: this project's real RECAPTCHA_SECRET_KEY, and Google's published test secret.
// Do not embed the actual secret values here — this file ships to every browser.
const KNOWN_MISCONFIGURED_FINGERPRINTS = new Set([
  '61abef62ac689815', // real backend RECAPTCHA_SECRET_KEY, mistakenly pasted as site key
  '4608ac189d54931b', // Google's published reCAPTCHA test secret
])

/** Small non-cryptographic fingerprint, just to compare against known-bad constants
 *  without keeping their plaintext in the shipped bundle. */
function fingerprint(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0
  h2 = (Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)) >>> 0
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

/**
 * Resolve the v2 checkbox site key. Never use RECAPTCHA_SECRET_KEY here.
 * The site key is intentionally public (embedded in the page / visible in Network).
 * Only RECAPTCHA_SECRET_KEY on the backend must stay private.
 */
export function resolveRecaptchaSiteKey() {
  const raw = readEnv('RECAPTCHA_SITE_KEY', '')
  if (!raw) return GOOGLE_RECAPTCHA_TEST_SITE_KEY
  if (KNOWN_MISCONFIGURED_FINGERPRINTS.has(fingerprint(raw))) {
    if (import.meta.env.DEV) {
      console.warn(
        '[recaptcha] VITE_RECAPTCHA_SITE_KEY must be the site key from Google Admin, not RECAPTCHA_SECRET_KEY. Using Google test key.'
      )
    }
    return GOOGLE_RECAPTCHA_TEST_SITE_KEY
  }
  if (!/^6L[\w-]{30,}$/.test(raw)) {
    if (import.meta.env.DEV) {
      console.warn('[recaptcha] Invalid VITE_RECAPTCHA_SITE_KEY format; using Google test key.')
    }
    return GOOGLE_RECAPTCHA_TEST_SITE_KEY
  }
  return raw
}
