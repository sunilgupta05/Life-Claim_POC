/** Map assessor-fetch / DB rows → registration-aligned UI keys for Eagle tables. */

function pick(row, ...keys) {
  for (const k of keys) {
    if (row?.[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  return '';
}

export function normalizeHospitalRow(row = {}) {
  return {
    hospitalName: pick(row, 'hospitalName', 'name', 'NAME', 'otherHospitalName'),
    admissionDate: pick(row, 'admissionDate', 'dtOfAdmn', 'DT_OF_ADMN'),
    dischargeDate: pick(row, 'dischargeDate', 'dtOfDischarge', 'DT_OF_DISCHARGE'),
    diagnosis: pick(row, 'diagnosis', 'diagnosisDt', 'DIAGNOSIS_DT'),
    natureOfIllness: pick(row, 'natureOfIllness', 'NATURE_OF_ILLNESS'),
    hospitalAddress: pick(row, 'hospitalAddress', 'addressId', 'ADDRESS_ID'),
  };
}

export function normalizeDoctorRow(row = {}) {
  return {
    doctorName: pick(row, 'doctorName', 'DOCTOR_NAME'),
    regNo: pick(row, 'regNo', 'registrationNo', 'REG_NO'),
    qualification: pick(row, 'qualification', 'QUALIFICATION'),
    firstConsultDate: pick(row, 'firstConsultDate', 'visitDate', 'dtOfFirstConsul', 'DT_OF_FIRST_CONSUL'),
    causeOfDeath: pick(row, 'causeOfDeath', 'CAUSE_OF_DEATH'),
    specialization: pick(row, 'specialization', 'otherQualification', 'OTHER_QUALIFICATION'),
    hospitalName: pick(row, 'hospitalName', 'HOSPITAL_ID'),
  };
}

export function normalizeProofRow(row = {}) {
  return {
    proofType: pick(row, 'proofType', 'PROOF_TYPE'),
    documentType: pick(row, 'documentType', 'DOCUMENT_TYPE'),
    issueDate: pick(row, 'issueDate', 'ISSUE_DATE'),
    documentId: pick(row, 'documentId', 'documentNo', 'DOCUMENT_ID'),
    holderName: pick(row, 'holderName', 'letterName', 'LETTER_NAME'),
    isLetterSubmitted: pick(row, 'isLetterSubmitted', 'IS_LETTER_SUBMITTED'),
    category: pick(row, 'category', 'CATEGORY'),
  };
}

export function normalizeInsuranceProofRow(row = {}) {
  return {
    proofType: pick(row, 'proofType', 'PROOF_TYPE'),
    documentId: pick(row, 'documentId', 'DOCUMENT_ID'),
    holderName: pick(row, 'holderName', 'letterName', 'LETTER_NAME'),
    dobOnDoc: pick(row, 'dobOnDoc', 'DOB_ON_DOC'),
    issueDate: pick(row, 'issueDate', 'ISSUE_DATE'),
    aadhaarMatch: pick(row, 'aadhaarMatch', 'AADHAAR_MATCH'),
    panMatch: pick(row, 'panMatch', 'PAN_MATCH'),
  };
}

export function normalizeWitnessRow(row = {}) {
  return {
    witnessName: pick(row, 'witnessName', 'name', 'NAME'),
    relation: pick(row, 'relation', 'relLa', 'REL_LA'),
    mobileNo: pick(row, 'mobileNo', 'MOBILE_NO', 'addressId', 'ADDRESS_ID'),
    address: pick(row, 'address', 'ADDRESS_ID'),
    signature: pick(row, 'signature', 'SIGNATURE'),
  };
}

export function normalizeIncomeRow(row = {}) {
  return {
    financialYear: pick(row, 'financialYear', 'FINANCIAL_YEAR'),
    proofType: pick(row, 'proofType', 'PROOF_ID'),
    incomeAmount: pick(row, 'incomeAmount', 'proofSeqNo', 'PROOF_SEQ_NO'),
    issueDate: pick(row, 'issueDate', 'ISSUE_DATE'),
    emailId: pick(row, 'emailId', 'EMAIL_ID'),
    mobileNo: pick(row, 'mobileNo', 'MOBILE_NO'),
    remarks: pick(row, 'remarks', 'REMARKS'),
  };
}

const TABLE_NORMALIZERS = {
  hospitalDetailsTable: normalizeHospitalRow,
  doctorDetailsTable: normalizeDoctorRow,
  proofDetailsTable: normalizeProofRow,
  insuranceProofDetailsTable: normalizeInsuranceProofRow,
  witnessDetailsTable: normalizeWitnessRow,
  incomeDetailsTable: normalizeIncomeRow,
};

export function normalizeDemogsEagleTables(demogs = {}) {
  if (!demogs || typeof demogs !== 'object') return demogs;
  const next = { ...demogs };
  Object.entries(TABLE_NORMALIZERS).forEach(([key, fn]) => {
    if (Array.isArray(demogs[key])) {
      next[key] = demogs[key].map(fn);
    }
  });
  return next;
}
