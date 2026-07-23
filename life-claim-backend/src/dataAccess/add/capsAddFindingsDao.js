const CapsAddFindings = require('../../models/add/CapsAddFindings');
const { assertCaseEditable } = require('../../util/capsAddCaseGuards');

function normalizeCaseId(raw) {
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function dedupeFindings(findingsList = []) {
  const seen = new Set();
  return findingsList.filter((item) => {
    const key = [
      String(item.findings || '').trim().toLowerCase(),
      String(item.remarks || '').trim().toLowerCase(),
      String(item.rule || '').trim().toLowerCase(),
    ].join('|');
    if (!key || key === '||') return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Save multiple findings to caps_add_findings (one set per case — replaces prior rows).
 */
const saveFindings = async (findingsList, username) => {
    try {
        const unique = dedupeFindings(findingsList);
        if (!unique.length) {
            throw new Error('No valid findings to save');
        }

        const caseId = normalizeCaseId(unique[0].case_id || unique[0].caseId);
        if (!caseId) {
            throw new Error('Invalid case id');
        }

        await assertCaseEditable(caseId);
        await CapsAddFindings.destroy({ where: { case_id: caseId } });

        const findingsToSave = unique.map((item) => ({
            case_id: caseId,
            findings: item.findings,
            remarks: item.remarks,
            rule: item.rule,
            decision: item.decision,
            severity: item.severity,
            ailment_name: item.ailment_name || item.ailmentName,
            ailment_type: item.ailment_type || item.ailmentType,
            type_of_evidence: item.type_of_evidence || item.evidenceType,
            medical_records: 'medical_records',
            created_by: username,
            created_on: new Date(),
            modified_by: username,
            modified_on: new Date(),
        }));

        return await CapsAddFindings.bulkCreate(findingsToSave);
    } catch (error) {
        console.error('Error in saveFindings DAO:', error);
        throw error;
    }
};

module.exports = {
    saveFindings
};
