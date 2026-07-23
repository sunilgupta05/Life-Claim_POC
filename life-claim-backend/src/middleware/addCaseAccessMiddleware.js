const CapsAddDetails = require('../models/add/CapsAddDetails');
const { hasSuperUserAccess } = require('../util/superuserRoles');
const { getUserContext } = require('./claimAccessMiddleware');

const ADD_OPERATIONAL_ROLES = new Set(['Pre Assessor', 'Assessor', 'Verifier']);

function hasAddOperationalRole(roles) {
  return roles.some((r) => ADD_OPERATIONAL_ROLES.has(r));
}

function parseCaseIds(req) {
  if (Array.isArray(req.body?.caseIds)) {
    return req.body.caseIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  const decisionCaseId = Number(req.body?.decisionData?.case_id);
  if (Number.isFinite(decisionCaseId)) {
    return [decisionCaseId];
  }

  if (Array.isArray(req.body?.findings)) {
    const fromFindings = req.body.findings
      .map((row) => Number(row.case_id ?? row.caseId))
      .filter((id) => Number.isFinite(id));
    return [...new Set(fromFindings)];
  }

  if (Array.isArray(req.body?.caseId)) {
    return req.body.caseId.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  const raw = req.body?.caseId ?? req.body?.case_id ?? req.params?.caseId ?? req.params?.id;
  const single = Number(raw);
  return Number.isFinite(single) ? [single] : [];
}

async function fetchAddCase(caseId) {
  return CapsAddDetails.findOne({
    where: { case_id: caseId },
    attributes: ['case_id', 'assigned_to', 'created_by'],
    raw: true,
  });
}

async function checkAddCaseAccess(username, roles, caseId) {
  if (!Number.isFinite(caseId) || !username) return false;
  if (hasSuperUserAccess(roles, username)) return true;
  if (!hasAddOperationalRole(roles)) return false;

  const row = await fetchAddCase(caseId);
  if (!row) return false;

  const assignedTo = String(row.assigned_to || '').trim();
  const createdBy = String(row.created_by || '').trim();

  if (!assignedTo) {
    return true;
  }
  if (assignedTo === username) return true;
  if (createdBy === username) return true;

  return false;
}

async function assertAddCaseAccess(username, roles, caseIds) {
  const blocked = [];
  for (const caseId of caseIds) {
    const ok = await checkAddCaseAccess(username, roles, caseId);
    if (!ok) blocked.push(caseId);
  }
  return blocked;
}

const authorizeAddCaseBodyAccess = async (req, res, next) => {
  try {
    const caseIds = parseCaseIds(req);
    const { username, roles } = getUserContext(req);

    if (!caseIds.length) {
      return res.status(400).json({ success: false, error: 'Case ID is required.' });
    }
    if (!username) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const blocked = await assertAddCaseAccess(username, roles, caseIds);
    if (blocked.length) {
      return res.status(403).json({
        success: false,
        error: `Access denied for case(s): ${blocked.join(', ')}`,
      });
    }

    req.addCaseIds = caseIds;
    return next();
  } catch (error) {
    console.error('addCaseAccessMiddleware >> authorizeAddCaseBodyAccess error:', error.message || error);
    return res.status(500).json({ success: false, error: 'Failed to validate case access.' });
  }
};

module.exports = {
  checkAddCaseAccess,
  authorizeAddCaseBodyAccess,
};
