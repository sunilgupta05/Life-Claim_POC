const axios = require('axios');
const logger = require('../config/logConfig');

const CAPTCHA_UNAVAILABLE_TOKEN = '__CAPTCHA_UNAVAILABLE__';
const RECAPTCHA_TEST_SECRET_FALLBACK = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
const isProduction = process.env.NODE_ENV === 'production';
const envName = (process.env.ENVIRONMENT || '').toUpperCase();
const isNonProdEnvironment = envName && envName !== 'PRODUCTION' && envName !== 'PROD';
const CAPTCHA_BYPASS_ALLOWED =
  process.env.ALLOW_CAPTCHA_BYPASS === 'true' ||
  process.env.NODE_ENV !== 'production' ||
  isNonProdEnvironment;

/**
 * Verify Google reCAPTCHA v2 response token.
 * @throws Error with .status for HTTP mapping
 */
async function verifyRecaptchaToken(captchaToken) {
  const recaptchaSecret =
    process.env.RECAPTCHA_SECRET_KEY || RECAPTCHA_TEST_SECRET_FALLBACK;

  if (isProduction && !process.env.RECAPTCHA_SECRET_KEY) {
    logger.error(
      '[security] RECAPTCHA_SECRET_KEY is not set — using Google test secret; set a production secret in .env'
    );
  }

  if (!captchaToken || captchaToken === CAPTCHA_UNAVAILABLE_TOKEN) {
    if (CAPTCHA_BYPASS_ALLOWED && captchaToken === CAPTCHA_UNAVAILABLE_TOKEN) {
      logger.warn('reCAPTCHA bypass used (unavailable token)');
      return;
    }
    const err = new Error('reCAPTCHA verification required.');
    err.status = 400;
    throw err;
  }

  if (CAPTCHA_BYPASS_ALLOWED && process.env.ALLOW_CAPTCHA_BYPASS === 'true') {
    logger.warn('reCAPTCHA backend verification skipped (ALLOW_CAPTCHA_BYPASS=true)');
    return;
  }

  try {
    const verifyRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params: { secret: recaptchaSecret, response: captchaToken }, timeout: 5000 }
    );
    if (!verifyRes.data?.success) {
      const useTestSecret =
        !isProduction &&
        process.env.RECAPTCHA_SECRET_KEY &&
        recaptchaSecret !== RECAPTCHA_TEST_SECRET_FALLBACK;
      if (useTestSecret) {
        const testRes = await axios.post(
          'https://www.google.com/recaptcha/api/siteverify',
          null,
          {
            params: { secret: RECAPTCHA_TEST_SECRET_FALLBACK, response: captchaToken },
            timeout: 5000,
          }
        );
        if (testRes.data?.success) {
          logger.warn(
            'reCAPTCHA verified with Google test secret (frontend test widget; set VITE_RECAPTCHA_SITE_KEY to your real site key for production pair)'
          );
          return;
        }
      }
      const err = new Error('reCAPTCHA verification failed. Please try again.');
      err.status = 400;
      throw err;
    }
  } catch (captchaErr) {
    if (captchaErr.status) throw captchaErr;
    const err = new Error('reCAPTCHA service unavailable. Please try again later.');
    err.status = 503;
    throw err;
  }
}

module.exports = {
  verifyRecaptchaToken,
  CAPTCHA_UNAVAILABLE_TOKEN,
};
