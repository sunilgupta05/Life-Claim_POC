import { readEnv } from '../util/env'

export const APP_ENVIRONMENT = readEnv('ENVIRONMENT', 'SIT').toUpperCase()

export const IS_SIT_OR_DEV =
  APP_ENVIRONMENT === 'SIT' ||
  APP_ENVIRONMENT === 'DEVELOPMENT' ||
  APP_ENVIRONMENT === 'DEV' ||
  import.meta.env.DEV

/** Login may bypass widget when true or SIT (pairs with backend ENVIRONMENT / ALLOW_CAPTCHA_BYPASS). */
export function isCaptchaOptional() {
  if (readEnv('CAPTCHA_OPTIONAL', '').toLowerCase() === 'true') return true
  return IS_SIT_OR_DEV
}
