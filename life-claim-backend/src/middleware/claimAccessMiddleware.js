const logger = require('../util/logger');
const db = require('../config/dbConfig');
const { hasSuperUserAccess } = require('../util/superuserRoles');
const { extractKeycloakRoles, extractKeycloakUsername } = require('../util/keycloakRoles');

const OPERATIONAL_CLAIM_ROLES = new Set(['Pre Assessor', 'Assessor', 'Verifier']);

function getUserContext(req) {
  const user = req.user || {};
  const tokenContent = req.kauth?.grant?.access_token?.content || {};
  const username = String(user.username || extractKeycloakUsername(tokenContent) || '').trim();
  const roles = Array.isArray(user.roles) && user.roles.length
    ? user.roles
    : extractKeycloakRoles(tokenContent);
  return { username, roles };
}

const isSuperUser = (roles, username = '') => hasSuperUserAccess(roles, username);
const hasOperationalClaimRole = (roles) => roles.some((r) => OPERATIONAL_CLAIM_ROLES.has(r));

const getClaimNumberFromRequest = (req) =>
  String(
    req.body?.claimNo ||
      req.body?.claimNumber ||
      req.body?.claimId ||
      req.params?.claimNo ||
      req.params?.claimNumber ||
      '',
  ).trim();

async function fetchClaimRow(claimNumber) {
  const [rows] = await db.execute(
    `SELECT CLAIM_NUMBER, ROLE, ASSIGNED_TO, CREATED_BY, MODIFIED_BY,
            ASSESSMENT_USERNAME, APPROVER_USERNAME
     FROM claims_poc.claims
     WHERE CLAIM_NUMBER = ?
     LIMIT 1`,
    [claimNumber],
  );
  return rows[0] || null;
}

function roleMatchesPoolClaim(userRoles, claimRole) {
  const role = String(claimRole || '').trim();
  if (role === 'Assessor') return userRoles.includes('Assessor');
  if (role === 'Verifier') return userRoles.includes('Verifier');
  if (role === 'Pre Assessor') return userRoles.includes('Pre Assessor');
  return false;
}

function isLinkedToClaim(username, row) {
  if (!row || !username) return false;
  const fields = [
    row.ASSIGNED_TO,
    row.CREATED_BY,
    row.MODIFIED_BY,
    row.ASSESSMENT_USERNAME,
    row.APPROVER_USERNAME,
  ];
  return fields.some((v) => String(v || '').trim() === username);
}

/**
 * Returns true when the user may read or mutate this claim.
 * Superuser, linked users, or matching unassigned pool claims only.
 */
async function checkClaimAccess(username, roles, claimNumber) {
  if (!claimNumber || !username) return false;
  if (isSuperUser(roles, username)) return true;

  const row = await fetchClaimRow(claimNumber);
  if (!row) return false;

  if (isLinkedToClaim(username, row)) return true;

  const assignedTo = String(row.ASSIGNED_TO || '').trim();
  if (!assignedTo && roleMatchesPoolClaim(roles, row.ROLE)) {
    return hasOperationalClaimRole(roles);
  }

  return false;
}

async function sendForbidden(res, message = 'Forbidden: you are not authorized to access this claim.') {
  return res.status(403).json({ message });
}

const authorizeClaimAccess = (resolveClaimNumber = getClaimNumberFromRequest) => async (req, res, next) => {
  try {
    const claimNumber = resolveClaimNumber(req);
    const { username, roles } = getUserContext(req);

    if (!claimNumber) {
      return res.status(400).json({ message: 'Claim number is required.' });
    }
    if (!username) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!hasOperationalClaimRole(roles) && !isSuperUser(roles, username)) {
      return sendForbidden(res);
    }

    const allowed = await checkClaimAccess(username, roles, claimNumber);
    if (!allowed) {
      return sendForbidden(res);
    }

    req.claimNumber = claimNumber;
    return next();
  } catch (error) {
    logger.error('claimAccessMiddleware >> authorizeClaimAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate claim access.' });
  }
};

const authorizeClaimBodyAccess = authorizeClaimAccess(getClaimNumberFromRequest);
const authorizeClaimParamAccess = authorizeClaimAccess(getClaimNumberFromRequest);

const authorizePreviewNodeAccess = async (req, res, next) => {
  try {
    const nodeId = String(req.params?.nodeId || '').trim();
    const { username, roles } = getUserContext(req);

    if (!nodeId) {
      return res.status(400).json({ message: 'Document node ID is required.' });
    }

    const [rows] = await db.execute(
      'SELECT claimId FROM claims_poc.UploadedDocuments WHERE AlfrescoFileId = ? LIMIT 1',
      [nodeId],
    );

    if (!rows.length || !rows[0].claimId) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const claimNumber = String(rows[0].claimId).trim();
    const allowed = await checkClaimAccess(username, roles, claimNumber);
    if (!allowed) {
      return sendForbidden(res, 'Forbidden: you are not authorized to preview this document.');
    }

    req.claimNumber = claimNumber;
    return next();
  } catch (error) {
    logger.error('claimAccessMiddleware >> authorizePreviewNodeAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate document access.' });
  }
};

/** Pool self-assign: only unassigned claims in the user's pool role. */
const authorizePoolAssignAccess = async (req, res, next) => {
  try {
    const claimNumber = String(req.params?.claimNumber || '').trim();
    const { username, roles } = getUserContext(req);

    if (!claimNumber || !username) {
      return res.status(400).json({ message: 'Claim number is required.' });
    }
    if (isSuperUser(roles, username)) {
      req.claimNumber = claimNumber;
      return next();
    }

    const row = await fetchClaimRow(claimNumber);
    if (!row) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    const assignedTo = String(row.ASSIGNED_TO || '').trim();
    if (assignedTo && assignedTo !== username) {
      return sendForbidden(res, 'Forbidden: this claim is already assigned to another user.');
    }
    if (assignedTo === username) {
      req.claimNumber = claimNumber;
      return next();
    }

    if (!roleMatchesPoolClaim(roles, row.ROLE)) {
      return sendForbidden(res, 'Forbidden: this claim is not in your pool.');
    }

    req.claimNumber = claimNumber;
    return next();
  } catch (error) {
    logger.error('claimAccessMiddleware >> authorizePoolAssignAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate pool assignment access.' });
  }
};

/** Bulk claim assign: every claim in the body must be accessible to the caller. */
const authorizeAssignClaimsBodyAccess = async (req, res, next) => {
  try {
    const claims = req.body?.claims;
    const { username, roles } = getUserContext(req);

    if (!Array.isArray(claims) || !claims.length) {
      return res.status(400).json({ message: 'claims must be a non-empty array.' });
    }
    if (!username) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    for (const entry of claims) {
      const claimNumber = String(
        (entry && typeof entry === 'object'
          ? entry.claimNumber || entry.claimNo || entry.claimId
          : entry) || '',
      ).trim();
      if (!claimNumber) {
        return res.status(400).json({ message: 'Each claim entry must include a claim number.' });
      }
      const allowed = await checkClaimAccess(username, roles, claimNumber);
      if (!allowed) {
        return sendForbidden(res, `Forbidden: you are not authorized to assign claim ${claimNumber}.`);
      }
    }

    return next();
  } catch (error) {
    logger.error('claimAccessMiddleware >> authorizeAssignClaimsBodyAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate claim assignment access.' });
  }
};

/**
 * Txn / policy lookups: when claimNumber is present, enforce claim access;
 * otherwise require an operational claim role (policy-level workspace data).
 */
const authorizePolicyOrClaimBodyAccess = async (req, res, next) => {
  try {
    const claimNumber = getClaimNumberFromRequest(req);
    const { username, roles } = getUserContext(req);

    if (!username) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (claimNumber) {
      const allowed = await checkClaimAccess(username, roles, claimNumber);
      if (!allowed) return sendForbidden(res);
      req.claimNumber = claimNumber;
      return next();
    }

    if (!hasOperationalClaimRole(roles) && !isSuperUser(roles, username)) {
      return sendForbidden(res);
    }
    return next();
  } catch (error) {
    logger.error('claimAccessMiddleware >> authorizePolicyOrClaimBodyAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate policy/claim access.' });
  }
};

/** History search: claim lookups require claim access; policy-only needs operational role. */
const authorizeHistorySearchAccess = async (req, res, next) => {
  try {
    const claimNumber = String(req.body?.claimNumber || '').trim();
    const policyNumber = String(req.body?.policyNumber || '').trim();
    const { username, roles } = getUserContext(req);

    if (!claimNumber && !policyNumber) {
      return res.status(400).json({ message: 'Either policy number or claim number is required' });
    }

    if (claimNumber) {
      const allowed = await checkClaimAccess(username, roles, claimNumber);
      if (!allowed) return sendForbidden(res);
      req.claimNumber = claimNumber;
      return next();
    }

    if (!hasOperationalClaimRole(roles) && !isSuperUser(roles, username)) {
      return sendForbidden(res);
    }
    return next();
  } catch (error) {
    logger.error('claimAccessMiddleware >> authorizeHistorySearchAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate history search access.' });
  }
};

module.exports = {
  OPERATIONAL_CLAIM_ROLES,
  getUserContext,
  getClaimNumberFromRequest,
  checkClaimAccess,
  authorizeClaimBodyAccess,
  authorizeClaimParamAccess,
  authorizePreviewNodeAccess,
  authorizePoolAssignAccess,
  authorizeAssignClaimsBodyAccess,
  authorizePolicyOrClaimBodyAccess,
  authorizeHistorySearchAccess,
};
