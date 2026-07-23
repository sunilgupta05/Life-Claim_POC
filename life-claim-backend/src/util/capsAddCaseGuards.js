const CapsAddDetails = require('../models/add/CapsAddDetails');
const CapsAddAssessorPoolCases = require('../models/add/CapsAddAssessorPoolCases');

function normStatus(caseStatus) {
  return String(caseStatus || '').trim().toUpperCase();
}

function isFinalizedApproverStatus(caseStatus) {
  const status = normStatus(caseStatus);
  return status.includes('APPROVED BY APPROVER') || status.includes('REJECTED BY APPROVER');
}

function isCaseClosed(caseStatus) {
  return normStatus(caseStatus).includes('CASE CLOSED');
}

function isMovedToReferred(caseStatus) {
  const status = normStatus(caseStatus);
  return status.includes('MOVED TO BE REFFERED') || status.includes('MOVED TO BE REFERRED');
}

function isTerminalStatus(caseStatus) {
  return isCaseClosed(caseStatus) || isFinalizedApproverStatus(caseStatus);
}

function isExcludedCase(row) {
  if (!row) return false;
  if (row.is_excluded === 'Y' || row.is_excluded === true) return true;
  if (row.exclusion_type_rule) return true;
  if (row.exclusion_type) return true;
  return false;
}

/**
 * @param {string} caseStatus
 * @param {'close_exclusion'|'move_referred'|'save_findings'|'save_decision'|'approve'|'reject'} action
 * @param {{ isExcluded?: boolean|string }} [options]
 */
function canPerformAddAction(caseStatus, action, options = {}) {
  const excluded = options.isExcluded === 'Y' || options.isExcluded === true;

  switch (action) {
    case 'close_exclusion':
      return excluded && !isTerminalStatus(caseStatus) && !isMovedToReferred(caseStatus);
    case 'move_referred':
      return !isTerminalStatus(caseStatus) && !isMovedToReferred(caseStatus);
    case 'save_findings':
    case 'save_decision':
      return !isCaseClosed(caseStatus) && !isFinalizedApproverStatus(caseStatus);
    case 'approve':
    case 'reject':
      return !isCaseClosed(caseStatus) && !isFinalizedApproverStatus(caseStatus);
    default:
      return false;
  }
}

async function getCaseRow(caseId) {
  const id = Number(caseId);
  if (!Number.isFinite(id)) return null;

  const row = await CapsAddDetails.findOne({
    where: { case_id: id },
    attributes: ['case_id', 'case_status', 'exclusion_type_rule'],
    raw: true,
  });
  if (!row) return null;

  const poolRow = await CapsAddAssessorPoolCases.findOne({
    where: { case_id: id },
    attributes: ['is_excluded', 'exclusion_type'],
    order: [['id', 'DESC']],
    raw: true,
  });

  return {
    ...row,
    is_excluded: poolRow?.is_excluded ?? (row.exclusion_type_rule ? 'Y' : 'N'),
    exclusion_type: poolRow?.exclusion_type ?? row.exclusion_type_rule,
  };
}

async function assertPoolAction(caseIds, action) {
  const ids = (Array.isArray(caseIds) ? caseIds : [caseIds])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!ids.length) {
    const err = new Error('No valid case IDs provided');
    err.statusCode = 400;
    throw err;
  }

  const blocked = [];
  for (const caseId of ids) {
    const row = await getCaseRow(caseId);
    if (!row) {
      blocked.push({ caseId, reason: 'Case not found' });
      continue;
    }
    if (!canPerformAddAction(row.case_status, action, { isExcluded: row.is_excluded === 'Y' })) {
      blocked.push({
        caseId,
        reason: actionReasonMessage(action, row.case_status),
      });
    }
  }

  if (blocked.length) {
    const err = new Error(
      blocked.map((b) => `Case ${b.caseId}: ${b.reason}`).join('; '),
    );
    err.statusCode = 409;
    err.blocked = blocked;
    throw err;
  }

  return ids;
}

function actionReasonMessage(action, caseStatus) {
  if (isFinalizedApproverStatus(caseStatus)) {
    return 'already approved or rejected by an approver';
  }
  if (isCaseClosed(caseStatus)) {
    return 'case is already closed';
  }
  if (action === 'move_referred' && isMovedToReferred(caseStatus)) {
    return 'case has already been moved to be referred';
  }
  if (action === 'close_exclusion') {
    return 'case cannot be closed as exclusion in its current state';
  }
  return 'action not allowed for current case status';
}

/** Block assessor edits after case is closed or approver has finalized. */
async function assertCaseEditable(caseId) {
  const row = await getCaseRow(caseId);
  if (!row) {
    const err = new Error('Case not found');
    err.statusCode = 404;
    throw err;
  }
  if (isCaseClosed(row.case_status)) {
    const err = new Error('This case is closed and cannot be changed.');
    err.statusCode = 409;
    throw err;
  }
  if (isFinalizedApproverStatus(row.case_status)) {
    const err = new Error('This case has already been decided by an approver and cannot be changed.');
    err.statusCode = 409;
    throw err;
  }
  return row;
}

/** Block duplicate approver approve/reject or action on closed cases. */
async function assertCasePendingApprover(caseId) {
  const row = await getCaseRow(caseId);
  if (!row) {
    const err = new Error('Case not found');
    err.statusCode = 404;
    throw err;
  }
  if (isCaseClosed(row.case_status)) {
    const err = new Error(`Case ${caseId} is closed and cannot be approved or rejected.`);
    err.statusCode = 409;
    throw err;
  }
  if (isFinalizedApproverStatus(row.case_status)) {
    const err = new Error(`Case ${caseId} has already been approved or rejected by an approver.`);
    err.statusCode = 409;
    throw err;
  }
  return row;
}

module.exports = {
  normStatus,
  isFinalizedApproverStatus,
  isCaseClosed,
  isMovedToReferred,
  isTerminalStatus,
  isExcludedCase,
  canPerformAddAction,
  getCaseRow,
  assertPoolAction,
  assertCaseEditable,
  assertCasePendingApprover,
};
