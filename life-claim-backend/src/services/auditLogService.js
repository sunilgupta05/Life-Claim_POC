const db = require("../config/dbConfig");
const logger = require("../config/logConfig");

const TRACKED_USERS = new Set(
  (process.env.AUDIT_TRACKED_USERS || "")
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean)
);
const SESSION_TTL_MINUTES = Number(process.env.AUDIT_SESSION_TTL_MINUTES || 5);

const isTrackedUser = (username) => {
  if (typeof username !== "string") return false;
  // If no tracked list is configured, track all users.
  if (TRACKED_USERS.size === 0) return true;
  return TRACKED_USERS.has(username.trim().toLowerCase());
};

const recordLogin = async ({ username, ipAddress, userAgent, roles }) => {
  if (!isTrackedUser(username)) return;

  let normalizedRoles = [];
  if (Array.isArray(roles)) normalizedRoles = roles;
  else if (typeof roles === "string" && roles.trim()) normalizedRoles = [roles.trim()];

  const query = `
    INSERT INTO claims_poc.user_login_audit (USERNAME, LOGIN_AT, IP_ADDRESS, USER_AGENT, USER_ROLES)
    VALUES (?, NOW(), ?, ?, ?)
  `;

  try {
    await db.execute(query, [
      username,
      ipAddress || null,
      userAgent || null,
      JSON.stringify(normalizedRoles),
    ]);
  } catch (error) {
    logger.error(`Audit recordLogin error for ${username}: ${error.message}`);
  }
};

const isMissingLogoutReasonColumn = (error) =>
  error && (error.code === 'ER_BAD_FIELD_ERROR' || Number(error.errno) === 1054);

const recordLogout = async ({ username, logoutReason }) => {
  if (!isTrackedUser(username)) return;

  const subSelect = `
      SELECT ID FROM (
        SELECT ID
        FROM claims_poc.user_login_audit
        WHERE USERNAME = ? AND LOGOUT_AT IS NULL
        ORDER BY LOGIN_AT DESC
        LIMIT 1
      ) AS latest_open_session`;

  const queryPlain = `
    UPDATE claims_poc.user_login_audit
    SET LOGOUT_AT = NOW()
    WHERE ID = (
      ${subSelect}
    )
  `;

  const safeReason =
    typeof logoutReason === 'string' && logoutReason.trim()
      ? logoutReason.trim().slice(0, 128)
      : '';

  if (safeReason) {
    const queryWithReason = `
    UPDATE claims_poc.user_login_audit
    SET LOGOUT_AT = NOW(), LOGOUT_REASON = ?
    WHERE ID = (
      ${subSelect}
    )
  `;
    try {
      await db.execute(queryWithReason, [safeReason, username]);
      return;
    } catch (error) {
      if (!isMissingLogoutReasonColumn(error)) {
        logger.error(`Audit recordLogout error for ${username}: ${error.message}`);
        return;
      }
    }
  }

  try {
    await db.execute(queryPlain, [username]);
  } catch (error) {
    logger.error(`Audit recordLogout error for ${username}: ${error.message}`);
  }
};

const hasActiveSession = async ({ username }) => {
  if (!isTrackedUser(username)) return false;

  const query = `
    SELECT COUNT(*) AS ACTIVE_COUNT
    FROM claims_poc.user_login_audit
    WHERE USERNAME = ?
      AND LOGOUT_AT IS NULL
      AND LOGIN_AT >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;

  try {
    const [rows] = await db.execute(query, [username, SESSION_TTL_MINUTES]);
    return Number(rows?.[0]?.ACTIVE_COUNT || 0) > 0;
  } catch (error) {
    logger.error(`Audit hasActiveSession error for ${username}: ${error.message}`);
    return false;
  }
};

const closeStaleSessions = async ({ username }) => {
  if (!isTrackedUser(username)) return;

  const query = `
    UPDATE claims_poc.user_login_audit
    SET LOGOUT_AT = NOW()
    WHERE USERNAME = ?
      AND LOGOUT_AT IS NULL
      AND LOGIN_AT < DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;

  try {
    await db.execute(query, [username, SESSION_TTL_MINUTES]);
  } catch (error) {
    logger.error(`Audit closeStaleSessions error for ${username}: ${error.message}`);
  }
};

const closeAllStaleSessions = async () => {
  const query = `
    UPDATE claims_poc.user_login_audit
    SET LOGOUT_AT = NOW()
    WHERE LOGOUT_AT IS NULL
      AND LOGIN_AT < DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;

  try {
    const [result] = await db.execute(query, [SESSION_TTL_MINUTES]);
    return Number(result?.affectedRows || 0);
  } catch (error) {
    logger.error(`Audit closeAllStaleSessions error: ${error.message}`);
    return 0;
  }
};

module.exports = {
  isTrackedUser,
  recordLogin,
  recordLogout,
  hasActiveSession,
  closeStaleSessions,
  closeAllStaleSessions,
};
