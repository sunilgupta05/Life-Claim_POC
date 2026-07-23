import { readEnv } from '../util/env'

/** Google reCAPTCHA v2 test site key (pairs with backend test secret). */
export const GOOGLE_RECAPTCHA_TEST_SITE_KEY =
  '6LeIxAcTAAAAAJcZVRqyHhUHMR1l1FMuNTMvMr8L'

/** Known mistake: backend RECAPTCHA_SECRET_KEY pasted as site key */
const SECRET_KEY_USED_AS_SITE_KEY = '6LcGWeQsAAAAAM10OlJVnCE0eFUKFjIpRyWFweBE'

/**
 * Resolve the v2 checkbox site key. Never use RECAPTCHA_SECRET_KEY here.
 * The site key is intentionally public (embedded in the page / visible in Network).
 * Only RECAPTCHA_SECRET_KEY on the backend must stay private.
 */
export function resolveRecaptchaSiteKey() {
  const raw = readEnv('RECAPTCHA_SITE_KEY', '')
  if (!raw) return GOOGLE_RECAPTCHA_TEST_SITE_KEY
  if (raw === SECRET_KEY_USED_AS_SITE_KEY || raw.includes('AGG-vFI1TnRWxMZNFuojJ4WifJWe')) {
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
