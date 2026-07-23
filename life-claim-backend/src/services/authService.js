// backend/services/authService.js
const bcrypt = require('bcrypt');
const jwtUtil = require('../util/jwtUtil');
const userDao = require('../dataAccess/userDao');
const logger = require('../config/logConfig');
const crypto = require('crypto'); // Added crypto for session generation
const { recordLogin, recordLogout } = require('./auditLogService');
const { isRetiredAdminUsername } = require('../util/superuserRoles');
const { verifyRecaptchaToken } = require('./recaptchaService');
const CLOSE_LOGOUT_GRACE_MS = Number(process.env.CLOSE_LOGOUT_GRACE_MS || 8000);
const pendingCloseLogoutTimers = new Map();
const SINGLE_SESSION_ENFORCED = process.env.SINGLE_SESSION_ENFORCED !== 'false';
const isProduction = process.env.NODE_ENV === 'production';
const ACCOUNT_LOCKOUT_MAX_ATTEMPTS = Number(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS || 5);
const ACCOUNT_LOCKOUT_DURATION_MS = Number(
  process.env.ACCOUNT_LOCKOUT_DURATION_MS || 15 * 60 * 1000
);
const INVALID_LOGIN_MESSAGE = 'Invalid username or password.';
// Precomputed bcrypt hash ("dummy-password") to reduce user-existence timing differences.
const DUMMY_BCRYPT_HASH =
  '$2b$10$Mri4RirA9N5h7vRYxlyquO2K/W7hM90SEyoBdrf8At8x15blO7fTS';
const clearPendingCloseLogout = (sessionId) => {
  if (!sessionId) return;
  const timer = pendingCloseLogoutTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    pendingCloseLogoutTimers.delete(sessionId);
  }
};

const loginUser = async (username, password, captchaToken, requestMeta = {}) => {
  await verifyRecaptchaToken(captchaToken);

  if (isRetiredAdminUsername(username)) {
    const err = new Error('The admin account is no longer available. Please sign in with superuser.');
    err.status = 403;
    throw err;
  }

  // Proceed with user lookup
  const user = await userDao.getUserByUsername(username);
  
  if (!user) {
    // Perform a dummy compare to avoid obvious timing differences between valid/invalid usernames.
    await bcrypt.compare(String(password || ''), DUMMY_BCRYPT_HASH);
    logger.warn(`[security] Login failed for username=${username}`);
    const err = new Error(INVALID_LOGIN_MESSAGE);
    err.status = 401;
    throw err;
  }

  // Expired lockout: reset counters so stale failure counts do not instantly re-lock (VAPT #21).
  if (user.lockout_until && new Date(user.lockout_until) <= new Date()) {
    await user.update({ failed_attempts: 0, lockout_until: null });
    user.failed_attempts = 0;
    user.lockout_until = null;
  }

  // Check if account is currently locked
  if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
    const diffMs = new Date(user.lockout_until) - new Date();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    const error = new Error(`Sign-in temporarily locked. Please wait ${minutes}m ${seconds}s.`);
    error.status = 403;
    error.lockout = true;
    error.remainingMs = diffMs;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const newCount = (user.failed_attempts || 0) + 1;
    const updateData = { failed_attempts: newCount };

    if (newCount >= ACCOUNT_LOCKOUT_MAX_ATTEMPTS) {
      updateData.lockout_until = new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION_MS);
      await user.update(updateData);

      const error = new Error(
        'Sign-in temporarily locked. Please try again later.'
      );
      error.status = 403;
      error.lockout = true;
      error.remainingMs = ACCOUNT_LOCKOUT_DURATION_MS;
      throw error;
    }
    await user.update(updateData);
    logger.error(
      `Invalid credentials for user: ${username}. Attempt ${newCount}/${ACCOUNT_LOCKOUT_MAX_ATTEMPTS}`
    );
    const error = new Error(INVALID_LOGIN_MESSAGE);
    error.status = 401;
    throw error;
  }

  // Successful login - reset failed attempts and lockout
  // Generate a session id for close-window scheduling/correlation.
  const sessionId = crypto.randomUUID();

  // Point 14 (Concurrent Login): enforce one active session per user.
  if (SINGLE_SESSION_ENFORCED && user.current_session_id) {
    const error = new Error('Concurrent login is not allowed. Please logout from your active session first.');
    error.status = 403;
    throw error;
  }

  await user.update({
    failed_attempts: 0,
    lockout_until: null,
    current_session_id: sessionId
  });

  const token = jwtUtil.sign({ 
    userId: user.id, 
    roles: user.roles,
    username: user.username,
    sessionId: sessionId // Include Session ID in JWT payload
  });
  logger.info(`USER ${username} logged in successfully. New Session: ${sessionId}`);

  await recordLogin({
    username: user.username,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    roles: user.roles,
  });
  
  return { token, user: { username: user.username, roles: user.roles } };
};

const logoutUser = async (userId) => {
  const user = await userDao.getUserById(userId);
  if (!user || !user.username) {
    return { success: false, message: 'User not found' };
  }

  clearPendingCloseLogout(user.current_session_id);

  await recordLogout({ username: user.username });
  await userDao.updateUser(userId, { current_session_id: null });
  logger.info(`USER ${user.username} logged out`);
  return { success: true, message: 'Logged out successfully' };
};

const logoutUserByToken = async (token) => {
  if (!token) {
    return { success: false, message: 'No token provided' };
  }

  try {
    const decodedToken = jwtUtil.verify(token);
    if (!decodedToken?.userId) {
      return { success: false, message: 'Invalid token payload' };
    }
    return await logoutUser(decodedToken.userId);
  } catch (error) {
    logger.warn(`logoutUserByToken skipped: ${error.message}`);
    return { success: false, message: 'Invalid or expired token' };
  }
};

const scheduleLogoutOnCloseByToken = async (token) => {
  if (!token) {
    return { success: false, message: 'No token provided' };
  }

  try {
    const decodedToken = jwtUtil.verify(token);
    const userId = decodedToken?.userId;
    const sessionId = decodedToken?.sessionId;
    if (!userId || !sessionId) {
      return { success: false, message: 'Invalid token payload' };
    }

    clearPendingCloseLogout(sessionId);

    const timer = setTimeout(async () => {
      pendingCloseLogoutTimers.delete(sessionId);
      try {
        const user = await userDao.getUserById(userId);
        if (!user) {
          return;
        }
        await logoutUser(userId);
        logger.info(`Close-window logout completed for userId=${userId}, session=${sessionId}`);
      } catch (error) {
        logger.error(`Close-window logout timer error: ${error.message}`);
      }
    }, CLOSE_LOGOUT_GRACE_MS);

    pendingCloseLogoutTimers.set(sessionId, timer);
    return { success: true, message: 'Close-window logout scheduled' };
  } catch (error) {
    logger.warn(`scheduleLogoutOnCloseByToken skipped: ${error.message}`);
    return { success: false, message: 'Invalid or expired token' };
  }
};

const authenticateUser = async (token) => {
  const decodedToken = jwtUtil.verify(token);

  if (!decodedToken) {
    throw new Error('Invalid token');
  }

  const user = await userDao.getUserById(decodedToken.userId);

  if (!user) {
    throw new Error('User not found');
  }

  const tokenSessionId = decodedToken.sessionId || null;
  const activeSessionId = user.current_session_id || null;
  if (
    SINGLE_SESSION_ENFORCED &&
    tokenSessionId &&
    tokenSessionId !== activeSessionId
  ) {
    throw new Error('Session expired');
  }

  // If browser was refreshed, cancel any pending close-window logout.
  clearPendingCloseLogout(tokenSessionId);

  return user;
};

module.exports = {
  loginUser, authenticateUser, logoutUser, logoutUserByToken, scheduleLogoutOnCloseByToken,
};
