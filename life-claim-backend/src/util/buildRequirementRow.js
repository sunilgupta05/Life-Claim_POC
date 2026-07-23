const { camelToSnakeCase, sanitizeDbDate } = require('./convertCase')

const REQUIREMENT_NAME_MAX = 100

/** Build snake_case row for Requirements table (one row per checklist document). */
function buildRequirementRowSnake(reqItem, createdBy, modifiedBy) {
  const fullName = String(
    reqItem.requirementName1
      || reqItem.requirementName
      || reqItem.documentName
      || reqItem.name
      || ''
  ).trim()

  const row = {
    requirementType:
      reqItem.requirementType1
      || reqItem.requirementType
      || reqItem.docType,
    source: reqItem.source1 || reqItem.source,
    status: reqItem.status1 || reqItem.status || reqItem.documentStatus,
    triggeredBy: reqItem.triggeredBy1 || reqItem.triggeredBy || 'System',
    triggeredDate: sanitizeDbDate(
      reqItem.triggerDate1 || reqItem.triggerDate || reqItem.triggeredDate
    ),
    receiptDate: sanitizeDbDate(reqItem.receiptDate1 || reqItem.receiptDate),
    createdBy,
    modifiedBy,
  }

  if (fullName.length > REQUIREMENT_NAME_MAX) {
    row.requirementName = `${fullName.slice(0, REQUIREMENT_NAME_MAX - 3)}...`
    row.remarks = fullName
  } else {
    row.requirementName = fullName
    if (reqItem.remarks || reqItem.remark) {
      row.remarks = reqItem.remarks || reqItem.remark
    }
  }

  return camelToSnakeCase(row)
}

module.exports = { buildRequirementRowSnake }
