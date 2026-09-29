// ---- Schema-driven form field definitions (roadmap 2.2) --------------------
// Forms described by DATA, rendered by components/forms/SchemaForm.jsx (which
// uses react-hook-form). Migrating these registration sections off static JSX.
// (Roadmap 2.3 will add per-deployment hidden/required toggles over these.)

/** IIB Enquiry sub-form (Assessment tab). Keys match the wizard's data/DB fields. */
export const IIB_ENQUIRY_FIELDS = [
  { name: 'iibRefNo', label: 'IIB Reference Number', type: 'text' },
  { name: 'iibEnquiryDate', label: 'Enquiry Date', type: 'date' },
  { name: 'iibStatus', label: 'Enquiry Status', type: 'select', options: ['Pending', 'Completed', 'Failed', 'Not Initiated'] },
  { name: 'iibPoliciesFound', label: 'No. of Policies Found', type: 'number' },
  { name: 'iibTotalSA', label: 'Total Sum Assured (₹)', type: 'text' },
  { name: 'iibFraudFlag', label: 'Fraud Flag', type: 'select', options: ['Yes', 'No', 'NA'] },
  { name: 'iibMultiplePolicy', label: 'Multiple Policy Detected', type: 'yesno' },
  { name: 'iibNonDisclosure', label: 'Non-Disclosure Detected', type: 'select', options: ['Yes', 'No', 'NA'] },
  { name: 'iibRemarks', label: 'IIB Remarks', type: 'textarea', rows: 3, colSpan: 'full', placeholder: 'Enter IIB enquiry findings...' },
]

/** Telecalling sub-form (Assessment tab). */
export const TELECALLING_FIELDS = [
  { name: 'telecallingDate', label: 'Telecalling Date', type: 'date' },
  { name: 'telecallerName', label: 'Telecaller Name', type: 'text' },
  { name: 'telecalledNumber', label: 'Called Number', type: 'text', maxLength: 10 },
  { name: 'telecallStatus', label: 'Call Status', type: 'select', options: ['Connected', 'Not Connected', 'Switched Off', 'Invalid Number', 'Callback Requested'] },
  { name: 'telecallDuration', label: 'Call Duration (mins)', type: 'number' },
  { name: 'telecallOutcome', label: 'Verification Outcome', type: 'select', options: ['Verified', 'Not Verified', 'Partial Verification', 'Suspicious', 'Requires Follow-up'] },
  { name: 'telecallingRemarks', label: 'Telecalling Remarks', type: 'textarea', rows: 4, colSpan: 'full', placeholder: 'Enter detailed telecalling remarks...' },
]

/** Decision tab → Accessor Decision sub-form. Keys match the wizard's data fields. */
export const DECISION_ACCESSOR_FIELDS = [
  { name: 'accessorDecision', label: 'Decision', type: 'select', required: true, options: ['Approve', 'Reject', 'Refer to Verifier', 'Request More Documents', 'Repudiate'] },
  { name: 'accessorAmount', label: 'Recommended Amount', type: 'text', placeholder: 'e.g. 1250000' },
  { name: 'accessorReason', label: 'Reason / Remarks', type: 'textarea', rows: 5, colSpan: 'full', placeholder: 'Provide detailed reasoning for your decision...' },
  { name: 'accessorName', label: 'Assessor Name', type: 'text', placeholder: 'Your name' },
  { name: 'accessorDecisionDate', label: 'Decision Date', type: 'date' },
]

/** Decision tab → Verification sub-form (completed by the Verifier role). */
export const DECISION_VERIFICATION_FIELDS = [
  { name: 'verificationStatus', label: 'Verification Status', type: 'select', options: ['Pending', 'In Progress', 'Verified', 'Rejected'] },
  { name: 'verifierName', label: 'Verifier Name', type: 'text', placeholder: 'Verifier name' },
  { name: 'verificationDate', label: 'Verification Date', type: 'date' },
  { name: 'sendMail', label: 'Send Mail on Completion', type: 'select', options: ['Yes', 'No'] },
  { name: 'verificationRemarks', label: 'Verification Remarks', type: 'textarea', rows: 4, colSpan: 'full', placeholder: 'Enter verification remarks...' },
]

/** Requirements tab → Communication sub-form (visible to Assessor+ roles). */
export const COMMUNICATION_FIELDS = [
  { name: 'commEmailSent', label: 'Email Sent to Claimant', type: 'select', options: ['Yes', 'No', 'Pending'] },
  { name: 'commEmailDate', label: 'Email Sent Date', type: 'date' },
  { name: 'commSmsSent', label: 'SMS Sent to Claimant', type: 'select', options: ['Yes', 'No', 'Pending'] },
  { name: 'commSmsDate', label: 'SMS Sent Date', type: 'date' },
  { name: 'commLetterSent', label: 'Letter Dispatched', type: 'select', options: ['Yes', 'No', 'Pending'] },
  { name: 'commLetterDate', label: 'Letter Dispatch Date', type: 'date' },
  { name: 'commWhatsapp', label: 'WhatsApp Notified', type: 'select', options: ['Yes', 'No', 'NA'] },
  { name: 'commRemarks', label: 'Communication Remarks', type: 'textarea', rows: 3, colSpan: 'full', placeholder: 'Enter communication details...' },
]

/** Fixed requirement checklist for Pre Assessor registration (v1 business list, v2 UI). */
export const REGISTRATION_REQUIREMENTS = [
  {
    id: 1,
    name:
      'No objection certificate and loan credit account statement from the institution/bank from where the loan was availed',
    docType: 'Important',
    source: 'ClaimantNonKYC',
    required: false,
  },
  {
    id: 2,
    name: 'Certificate from the employer',
    docType: 'Important',
    source: 'ClaimantNonKYC',
    required: false,
  },
  {
    id: 3,
    name:
      'Duly filled and signed payout mandate form along with copy of Cancelled Cheque/ Bank Statement/ Bank Passbook with printed name and account number of the nominee',
    docType: 'Mandatory',
    source: 'ClaimantNonKYC',
    required: true,
  },
  {
    id: 4,
    name:
      'Duly filled & Signed Claimant Statement Form from the nominee under the policy.',
    docType: 'Mandatory',
    source: 'ClaimantNonKYC',
    required: true,
  },
  {
    id: 5,
    name:
      'Address Proof of Claimant matching the address in the claim statement form. i.e. Aadhar Card, Valid Passport, Valid Driving Licence or Voter`s ID Card (any one)',
    docType: 'Mandatory',
    source: 'ClaimantKYC',
    required: true,
  },
  {
    id: 6,
    name:
      'Current Medical Records (admission notes, discharge summary, indoor case papers, test reports etc.) of the treatment undergone by the Life Assured',
    docType: 'Mandatory',
    source: 'ClaimantNonKYC',
    required: true,
  },
  {
    id: 7,
    name: 'Death Certificate of life assured issued by Local Authority',
    docType: 'Mandatory',
    source: 'ClaimantNonKYC',
    required: true,
  },
  {
    id: 8,
    name:
      'Previous medical records of the tests or treatment/s undergone by the Life Assured (Last 5 years), if any',
    docType: 'Mandatory',
    source: 'ClaimantNonKYC',
    required: true,
  },
  {
    id: 9,
    name:
      "Medical Attendant's / Hospital Certificate issued by the hospital where Life Assured was last treated / Admitted",
    docType: 'Mandatory',
    source: 'ClaimantNonKYC',
    required: true,
  },
  {
    id: 10,
    name: 'Claimant`s Photo ID Proof',
    docType: 'Important',
    source: 'ClaimantKYC',
    required: false,
  },
]

/** Fixed assessment questions — Yes / No only (v1 list, v2 UI). */
export const REGISTRATION_ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    section: 'Assessment',
    question:
      'Does the name of payee in system match with ALL of these documents: Claim form, Pol Cert, Photo ID and Address Proof?',
  },
  {
    id: 2,
    section: 'Assessment',
    question:
      'Is the payee address proof valid and does the address match with Claim form?',
  },
  {
    id: 3,
    section: 'Assessment',
    question:
      'Does the name of life assured on death certificate / Claim form match with Proposal form / Policy Certificate?',
  },
  {
    id: 4,
    section: 'Assessment',
    question:
      'Has life cover of other applicant terminated as a result of 1st Death, in case of Joint Life Cover?',
  },
  {
    id: 5,
    section: 'Assessment',
    question:
      'The amount of claim and documents are checked and claim is decided as per Policy Terms and Conditions',
  },
  {
    id: 6,
    section: 'Assessment',
    question:
      'The NAV to be given to the customer is as per the Time & Stamp updated in the claim form',
  },
  {
    id: 7,
    section: 'Assessment',
    question: 'There is no parallel policy which has impact on decision of this policy',
  },
  {
    id: 8,
    section: 'Assessment',
    question: 'There is no history of reinstatment of PDR found in last 2 years',
  },
  {
    id: 9,
    section: 'Assessment',
    question:
      'Policy benefits payable are as per the status (Inforce/Lapsed/Paid-up/Foreclosed etc) on the event date',
  },
  {
    id: 10,
    section: 'Assessment',
    question:
      'There is no evidence found of pre-existing ailment/other disclosure in the submitted documents.',
  },
  {
    id: 11,
    section: 'Assessment',
    question: 'There is no fraud flag observed against this case in the claim system.',
  },
  {
    id: 12,
    section: 'Assessment',
    question: 'Partial withdrawal is not done during the policy years.',
  },
  {
    id: 13,
    section: 'Assessment',
    question: 'Had the life assured suffered /treated from Covid 19 in past?',
  },
  {
    id: 14,
    section: 'Assessment',
    question: 'Covid 19 hospitalization',
  },
]
