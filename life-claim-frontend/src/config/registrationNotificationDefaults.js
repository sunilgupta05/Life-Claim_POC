import { IS_SIT_OR_DEV } from './appEnv'

/**
 * Pre-fill Life Assured contact + notification toggle during registration (SIT/dev only).
 * Values remain editable in the wizard before submit.
 */
export const REGISTRATION_NOTIFICATION_DEFAULTS = IS_SIT_OR_DEV
  ? {
      laEmailId: 'atharva.tripathi@dhdigital.co.in',
      laMobileNo: '9892394104',
      sendMail: 'Yes',
      verifierDetails: { sendMail: true },
    }
  : {}

export function withRegistrationNotificationDefaults(fields = {}) {
  return { ...REGISTRATION_NOTIFICATION_DEFAULTS, ...fields }
}
