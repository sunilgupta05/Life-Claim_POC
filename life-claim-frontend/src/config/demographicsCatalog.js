// src/config/demographicsCatalog.js
//
// Field catalogs (superset) for the Demographics tab sections (roadmap 2.3,
// Demographics extension). These describe which fields EXIST so an admin can
// Show/Hide + Require them from the Form Fields console. They are NOT rendered by
// the schema engine (Demographics keeps its hand-built JSX + policy auto-fill);
// they only drive the admin UI and the config-required check.
//
// `readOnly: true` marks fields that are auto-filled/computed (client id, risk
// indicator, age at death) — they can be hidden but are excluded from the
// Required check (there's nothing for a user to type).

/** Section 2 — Intimation Details (dates, source, death certificate). */
export const INTIMATION_FIELDS = [
  { name: 'intimationDate', label: 'Intimation Date', type: 'date', required: true },
  { name: 'source', label: 'Source', type: 'select', required: true },
  { name: 'bondType', label: 'Bond Type', type: 'select', required: true },
  { name: 'firPmReceived', label: 'FIR / PM Received', type: 'select', required: true },
  { name: 'declaredByDoctor', label: 'Declared by Doctor', type: 'select', required: true },
  { name: 'whatsappFlag', label: 'WhatsApp Flag', type: 'select' },
  { name: 'dateOfDeathEvent', label: 'Date of Death / Event', type: 'date', required: true },
  { name: 'dateOfDeathReg', label: 'Date of Death Registration', type: 'date', required: true },
  { name: 'dateOfCremation', label: 'Date of Cremation', type: 'date' },
  { name: 'dateOfAccident', label: 'Date of Accident', type: 'date' },
  { name: 'placeOfDeath', label: 'Place of Death', type: 'select', required: true },
  { name: 'policyStatusOnDod', label: 'Policy Status on DOD', type: 'text', readOnly: true },
  { name: 'deathCertificate', label: 'Death Certificate Type', type: 'select', required: true },
  { name: 'dcRegNumber', label: 'Reg. Number', type: 'text' },
  { name: 'dcRegDate', label: 'Reg. Date', type: 'date' },
  { name: 'dcIssueDistrict', label: 'Issue District', type: 'text' },
  { name: 'dcIssuingAuthority', label: 'Issuing Authority', type: 'text' },
  { name: 'dcTehsil', label: 'Tehsil', type: 'text' },
  { name: 'dcIssueState', label: 'Issue State', type: 'select' },
  { name: 'dcPlaceOnCertificate', label: 'Place on Certificate', type: 'text' },
  { name: 'dcVillageBlock', label: 'Village / Block', type: 'text' },
  { name: 'dcOfficerPosition', label: 'Officer Position', type: 'text' },
]

/** Section 6 — Life Assured Details (insured person). Keys match wizard data. */
export const LIFE_ASSURED_FIELDS = [
  { name: 'laName', label: 'Name', type: 'text', required: true },
  { name: 'laClientId', label: 'Client ID', type: 'text', readOnly: true },
  { name: 'laDob', label: 'Date of Birth', type: 'date' },
  { name: 'laGender', label: 'Gender', type: 'select' },
  { name: 'laRiskIndicator', label: 'Risk Indicator', type: 'text', readOnly: true },
  { name: 'laAgeAtDeath', label: 'Age at Death (Auto)', type: 'text', readOnly: true },
  { name: 'laIdProofType', label: 'ID Proof Type', type: 'select' },
  { name: 'laIdNumber', label: 'ID Number', type: 'text' },
  { name: 'laMobileNo', label: 'Mobile No', type: 'text' },
  { name: 'laEmailId', label: 'Email', type: 'text' },
  { name: 'laFlat', label: 'Flat/House No', type: 'text' },
  { name: 'laRoad', label: 'Road / Street', type: 'text' },
  { name: 'laArea', label: 'Area / Locality', type: 'text' },
  { name: 'laCity', label: 'City', type: 'text' },
  { name: 'laState', label: 'State', type: 'select' },
  { name: 'laPincode', label: 'Pincode', type: 'text' },
  { name: 'laOccCode', label: 'Occupation Code', type: 'text' },
  { name: 'laOccDesc', label: 'Occupation Description', type: 'text' },
  { name: 'laIncome', label: 'Annual Income', type: 'text' },
  { name: 'laEstName', label: 'Establishment Name', type: 'text' },
  { name: 'laDesignation', label: 'Designation', type: 'text' },
  { name: 'laNatureOfWork', label: 'Nature of Work', type: 'text' },
]

/** Section 7 — Contract Details (mostly policy-prefilled/read-only financials). */
export const CONTRACT_FIELDS = [
  { name: 'appNo', label: 'Application No', type: 'text' },
  { name: 'productName', label: 'Product Name', type: 'text', readOnly: true },
  { name: 'productCode', label: 'Product Code', type: 'text', readOnly: true },
  { name: 'cdfDate', label: 'CDF Signature Date', type: 'date' },
  { name: 'issueDate', label: 'Issue Date', type: 'date', readOnly: true },
  { name: 'riskCommencementDate', label: 'Risk Commencement Date', type: 'date', readOnly: true },
  { name: 'paidToDate', label: 'Paid to Date', type: 'date', readOnly: true },
  { name: 'premiumFrequency', label: 'Premium Frequency', type: 'text', readOnly: true },
  { name: 'premiumStatus', label: 'Premium Status', type: 'text', readOnly: true },
  { name: 'term', label: 'Policy Term (yrs)', type: 'text', readOnly: true },
  { name: 'premPaidYrs', label: 'Premium Paid Years', type: 'text', readOnly: true },
  { name: 'totalPremiumPaid', label: 'Total Premium Paid', type: 'text', readOnly: true },
  { name: 'originalSA', label: 'Original Sum Assured', type: 'text', readOnly: true },
  { name: 'currentSA', label: 'Current Sum Assured', type: 'text', readOnly: true },
  { name: 'cashValue', label: 'Cash Value', type: 'text', readOnly: true },
  { name: 'maturityValue', label: 'Maturity Value', type: 'text', readOnly: true },
  { name: 'outstandingLoan', label: 'Outstanding Loan', type: 'text' },
  { name: 'excessPremium', label: 'Excess Premium', type: 'text' },
  { name: 'uwDecision', label: 'UW Decision', type: 'text', readOnly: true },
  { name: 'uwDecisionDate', label: 'UW Decision Date', type: 'text', readOnly: true },
  { name: 'advisorCode', label: 'Advisor Code', type: 'text', readOnly: true },
  { name: 'advisorStatus', label: 'Advisor Status', type: 'text', readOnly: true },
  { name: 'policyAge', label: 'Policy Age (auto)', type: 'text', readOnly: true, required: true },
  { name: 'nameChangeDecl', label: 'Name Change Declared', type: 'select', required: true },
  { name: 'ekitPrinted', label: 'E-Kit Printed', type: 'select' },
  { name: 'assignment', label: 'Assignment', type: 'text', readOnly: true },
  { name: 'salesChannel', label: 'Sales Channel', type: 'text', readOnly: true },
]
