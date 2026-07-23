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
