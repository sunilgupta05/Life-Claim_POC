const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const asTrimmed = (value) => (typeof value === 'string' ? value.trim() : '');

const maxLen = (value, n) => String(value || '').length <= n;

const usernamePattern = /^[A-Za-z0-9._@-]{2,100}$/;
const claimNumberPattern = /^[A-Za-z0-9/_-]{2,100}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9]{10,15}$/;

const sendValidationError = (res, errors) =>
  res.status(400).json({
    message: 'Invalid request payload.',
    errors,
  });

const validateBody = (validator) => (req, res, next) => {
  if (!isObject(req.body)) {
    return sendValidationError(res, { body: 'Body must be a JSON object.' });
  }
  const errors = validator(req.body);
  if (errors && Object.keys(errors).length) {
    return sendValidationError(res, errors);
  }
  return next();
};

const isEncryptedPassword = (body) =>
  body.password_encrypted === true ||
  body.password_encrypted === 'true' ||
  body.password_encrypted === '1';

const validateKeycloakTokenBody = validateBody((body) => {
  const errors = {};
  const username = asTrimmed(body.username);
  const password = String(body.password || '');
  const encrypted = isEncryptedPassword(body);
  if (!usernamePattern.test(username)) {
    errors.username = 'Username format is invalid.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (encrypted && !maxLen(password, 4096)) {
    errors.password = 'Encrypted password payload is too long.';
  } else if (!encrypted && !maxLen(password, 256)) {
    errors.password = 'Password must be <= 256 chars.';
  }
  if (body.captchaToken !== undefined && !maxLen(body.captchaToken, 4096)) {
    errors.captchaToken = 'captchaToken is too long.';
  }
  return errors;
});

const validateAuthenticateBody = validateBody((body) => {
  const errors = {};
  if (body.token !== undefined) {
    const token = asTrimmed(body.token);
    if (!token || !maxLen(token, 4096)) {
      errors.token = 'Token format is invalid.';
    }
  }
  return errors;
});

const validateLegacyLoginBody = validateBody((body) => {
  const errors = {};
  const username = asTrimmed(body.username);
  const password = String(body.password || '');
  if (!usernamePattern.test(username)) {
    errors.username = 'Username format is invalid.';
  }
  if (!password || !maxLen(password, 256)) {
    errors.password = 'Password is required and must be <= 256 chars.';
  }
  if (body.captchaToken !== undefined && !maxLen(body.captchaToken, 4096)) {
    errors.captchaToken = 'captchaToken is too long.';
  }
  return errors;
});

const validateCreateUserBody = validateBody((body) => {
  const errors = {};
  if (!usernamePattern.test(asTrimmed(body.id))) errors.id = 'User id format is invalid.';
  if (!asTrimmed(body.firstName) || !maxLen(body.firstName, 100)) errors.firstName = 'Invalid firstName.';
  if (!asTrimmed(body.lastName) || !maxLen(body.lastName, 100)) errors.lastName = 'Invalid lastName.';
  if (!emailPattern.test(asTrimmed(body.email))) errors.email = 'Invalid email.';
  if (!phonePattern.test(asTrimmed(body.phoneNumber))) errors.phoneNumber = 'Invalid phoneNumber.';
  if (!asTrimmed(body.createdBy) || !maxLen(body.createdBy, 100)) errors.createdBy = 'Invalid createdBy.';
  if (!String(body.password || '') || !maxLen(body.password, 256)) errors.password = 'Invalid password.';
  if (!Array.isArray(body.roles) || body.roles.length === 0) errors.roles = 'roles must be a non-empty array.';
  return errors;
});

const validateUpdateUserBody = validateBody((body) => {
  const errors = {};
  const allowed = ['email', 'phoneNumber', 'password', 'active', 'roles', 'first_Name', 'last_Name'];
  const keys = Object.keys(body);
  if (keys.length === 0) {
    errors.body = 'At least one field must be provided.';
    return errors;
  }
  for (const key of keys) {
    if (!allowed.includes(key)) {
      errors[key] = 'Field is not allowed.';
    }
  }
  if (body.email !== undefined && !emailPattern.test(asTrimmed(body.email))) errors.email = 'Invalid email.';
  if (body.phoneNumber !== undefined && !phonePattern.test(asTrimmed(body.phoneNumber)))
    errors.phoneNumber = 'Invalid phoneNumber.';
  if (body.password !== undefined && (!String(body.password) || !maxLen(body.password, 256)))
    errors.password = 'Invalid password.';
  if (body.active !== undefined && typeof body.active !== 'boolean') errors.active = 'active must be boolean.';
  if (body.roles !== undefined && !Array.isArray(body.roles)) errors.roles = 'roles must be an array.';
  return errors;
});

const validateClaimByUsernameBody = validateBody((body) => {
  const errors = {};
  if (body.username !== undefined) {
    const username = asTrimmed(body.username);
    if (username && !usernamePattern.test(username)) {
      errors.username = 'Username format is invalid.';
    }
  }
  return errors;
});

const validateAssignClaimsBody = validateBody((body) => {
  const errors = {};
  if (!Array.isArray(body.claims) || body.claims.length === 0) {
    errors.claims = 'claims must be a non-empty array.';
  }
  if (body.username !== undefined && !usernamePattern.test(asTrimmed(body.username))) {
    errors.username = 'Username format is invalid.';
  }
  return errors;
});

const validateChangeStatusBody = validateBody((body) => {
  const errors = {};
  if (!claimNumberPattern.test(asTrimmed(body.claimNumber))) {
    errors.claimNumber = 'claimNumber format is invalid.';
  }
  if (!asTrimmed(body.status) || !maxLen(body.status, 60)) {
    errors.status = 'status is required and must be <= 60 chars.';
  }
  return errors;
});

const validateClaimNoBody = validateBody((body) => {
  const errors = {};
  const claimNo = asTrimmed(body.claimNo || body.claimNumber || body.claimId);
  if (!claimNumberPattern.test(claimNo)) {
    errors.claimNo = 'claimNo format is invalid.';
  }
  return errors;
});

const validatePolicyIdBody = validateBody((body) => {
  const errors = {};
  const policyId = asTrimmed(body.policyID || body.policyId || body.policyNumber);
  if (!policyId || !maxLen(policyId, 50)) {
    errors.policyID = 'policyID is required and must be <= 50 chars.';
  }
  return errors;
});

const validateFraudClaimBody = validateBody((body) => {
  const errors = {};
  if (!claimNumberPattern.test(asTrimmed(body.claimNumber))) {
    errors.claimNumber = 'claimNumber format is invalid.';
  }
  return errors;
});

module.exports = {
  validateKeycloakTokenBody,
  validateAuthenticateBody,
  validateLegacyLoginBody,
  validateCreateUserBody,
  validateUpdateUserBody,
  validateClaimByUsernameBody,
  validateAssignClaimsBody,
  validateChangeStatusBody,
  validateClaimNoBody,
  validatePolicyIdBody,
  validateFraudClaimBody,
};
