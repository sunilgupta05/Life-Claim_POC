const { sanitizeDateFields } = require('./convertCase');

function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  return null;
}

function mapHospitalRowToDb(row = {}) {
  const out = {
    NAME: pick(row, 'hospitalName', 'name', 'NAME'),
    DT_OF_ADMN: pick(row, 'admissionDate', 'dtOfAdmn', 'DT_OF_ADMN'),
    DT_OF_DISCHARGE: pick(row, 'dischargeDate', 'dtOfDischarge', 'DT_OF_DISCHARGE'),
    DIAGNOSIS_DT: pick(row, 'diagnosis', 'diagnosisDt', 'DIAGNOSIS_DT'),
    NATURE_OF_ILLNESS: pick(row, 'natureOfIllness', 'natureOfIllness', 'NATURE_OF_ILLNESS'),
    ADDRESS_ID: pick(row, 'hospitalAddress', 'addressId', 'ADDRESS_ID'),
    CREATED_BY: row.createdBy || row.CREATED_BY,
    MODIFIED_BY: row.modifiedBy || row.MODIFIED_BY,
  };
  return sanitizeDateFields(out, ['DT_OF_ADMN', 'DT_OF_DISCHARGE', 'DIAGNOSIS_DT']);
}

function mapDoctorRowToDb(row = {}) {
  const out = {
    DOCTOR_NAME: pick(row, 'doctorName', 'DOCTOR_NAME'),
    REG_NO: pick(row, 'regNo', 'registrationNo', 'REG_NO'),
    QUALIFICATION: pick(row, 'qualification', 'QUALIFICATION'),
    DT_OF_FIRST_CONSUL: pick(row, 'firstConsultDate', 'visitDate', 'dtOfFirstConsul', 'DT_OF_FIRST_CONSUL'),
    CAUSE_OF_DEATH: pick(row, 'causeOfDeath', 'CAUSE_OF_DEATH'),
    OTHER_QUALIFICATION: pick(row, 'specialization', 'otherQualification', 'OTHER_QUALIFICATION'),
    CREATED_BY: row.createdBy || row.CREATED_BY,
    MODIFIED_BY: row.modifiedBy || row.MODIFIED_BY,
  };
  return sanitizeDateFields(out, ['DT_OF_FIRST_CONSUL']);
}

function mapProofRowToDb(row = {}) {
  const out = {
    PROOF_TYPE: pick(row, 'proofType', 'PROOF_TYPE'),
    DOCUMENT_TYPE: pick(row, 'documentType', 'DOCUMENT_TYPE'),
    ISSUE_DATE: pick(row, 'issueDate', 'ISSUE_DATE'),
    DOCUMENT_ID: pick(row, 'documentId', 'documentNo', 'DOCUMENT_ID'),
    LETTER_NAME: pick(row, 'holderName', 'LETTER_NAME'),
    IS_LETTER_SUBMITTED: pick(row, 'isLetterSubmitted', 'IS_LETTER_SUBMITTED'),
    CREATED_BY: row.createdBy || row.CREATED_BY,
    MODIFIED_BY: row.modifiedBy || row.MODIFIED_BY,
  };
  return sanitizeDateFields(out, ['ISSUE_DATE']);
}

function mapInsuranceProofRowToDb(row = {}) {
  return mapProofRowToDb(row);
}

function mapWitnessRowToDb(row = {}) {
  return {
    NAME: pick(row, 'witnessName', 'name', 'NAME'),
    REL_LA: pick(row, 'relation', 'relLa', 'REL_LA'),
    ADDRESS_ID: pick(row, 'address', 'mobileNo', 'ADDRESS_ID'),
    SIGNATURE: pick(row, 'signature', 'SIGNATURE'),
    CREATED_BY: row.createdBy || row.CREATED_BY,
    MODIFIED_BY: row.modifiedBy || row.MODIFIED_BY,
  };
}

function mapIncomeRowToDb(row = {}) {
  const out = {
    FINANCIAL_YEAR: pick(row, 'financialYear', 'FINANCIAL_YEAR'),
    PROOF_ID: pick(row, 'proofType', 'incomeAmount', 'PROOF_ID'),
    ISSUE_DATE: pick(row, 'issueDate', 'ISSUE_DATE'),
    EMAIL_ID: pick(row, 'emailId', 'EMAIL_ID'),
    MOBILE_NO: pick(row, 'mobileNo', 'MOBILE_NO'),
    CREATED_BY: row.createdBy || row.CREATED_BY,
    MODIFIED_BY: row.modifiedBy || row.MODIFIED_BY,
  };
  return sanitizeDateFields(out, ['ISSUE_DATE']);
}

module.exports = {
  mapHospitalRowToDb,
  mapDoctorRowToDb,
  mapProofRowToDb,
  mapInsuranceProofRowToDb,
  mapWitnessRowToDb,
  mapIncomeRowToDb,
};
