/* ── Mock policy database ── */
export const POLICY_DB = {
  'POL-78432': {
    policyId:'POL-78432', productCode:'ENP01', productName:'Endowment Plus',
    sumAssured:1250000, issueDate:'2010-06-01', riskCommencementDate:'2010-06-01',
    paidToDate:'2025-06-01', premiumStatus:'Active', premiumFrequency:'Annual',
    term:20, premPaidYrs:15, firstPremDep:62500, totalPremPaid:937500,
    currentSA:1250000, originalSA:1250000, cashValue:875000, maturityValue:1425000,
    advisorCode:'ADV-12345', advisorStatus:'Active', uwDecision:'Standard',
    uwDecisionDate:'2010-05-15', salesChannel:'Agency', agentType:'Individual',
    claimStatus:'Active', custIndicator:'Regular', ekitPrinted:'Yes',
    ekitDate:'2010-06-15', assignment:'None', advocate:'None',
    clients:[
      { clientId:'CL-0001', name:'Ramesh', lastName:'Patel', dob:'1975-03-15', gender:'Male', role:'Life Assured', relation:'Self', riskIndicator:'Low', idNumber:'AAAPB1234C', panNo:'AAAPB1234C', panValidFlag:'Valid', flat:'12A', road:'MG Road', area:'Andheri', city:'Mumbai', state:'Maharashtra', country:'India', pincode:'400053', telNo:'', mobileNo:'9876543210', emailId:'ramesh.patel@email.com', nationality:'Indian', status:'Deceased' },
      { clientId:'CL-0002', name:'Sunita', lastName:'Patel', dob:'1978-07-20', gender:'Female', role:'Nominee', relation:'Spouse', riskIndicator:'Low', idNumber:'BBAPB5678D', panNo:'BBAPB5678D', panValidFlag:'Valid', flat:'12A', road:'MG Road', area:'Andheri', city:'Mumbai', state:'Maharashtra', country:'India', pincode:'400053', telNo:'', mobileNo:'9876543211', emailId:'sunita.patel@email.com', nationality:'Indian', status:'Alive' },
    ],
    riders:[
      { riderCode:'ADB', riderSA:1250000, riderRCD:'2010-06-01', riderTerm:20, riderStatus:'Active', riderCessationDate:'2030-06-01' },
      { riderCode:'CI', riderSA:500000, riderRCD:'2010-06-01', riderTerm:20, riderStatus:'Active', riderCessationDate:'2030-06-01' },
    ],
    agentRepudiation:[
      { caseNo:'REP-2018-01', reason:'Material Concealment', date:'2018-03-20', decision:'Repudiated', remarks:'Non-disclosure of pre-existing condition' },
    ],
  },
  'POL-65219': {
    policyId:'POL-65219', productCode:'TRM01', productName:'Term Protect',
    sumAssured:800000, issueDate:'2015-03-15', riskCommencementDate:'2015-03-15',
    paidToDate:'2025-03-15', premiumStatus:'Active', premiumFrequency:'Annual',
    term:25, premPaidYrs:10, firstPremDep:16000, totalPremPaid:160000,
    currentSA:800000, originalSA:800000, cashValue:0, maturityValue:0,
    advisorCode:'ADV-67890', advisorStatus:'Active', uwDecision:'Standard',
    uwDecisionDate:'2015-02-28', salesChannel:'Bancassurance', agentType:'Corporate',
    claimStatus:'Active', custIndicator:'Regular', ekitPrinted:'Yes',
    ekitDate:'2015-03-20', assignment:'None', advocate:'None',
    clients:[
      { clientId:'CL-0011', name:'Sunita', lastName:'Rao', dob:'1980-07-22', gender:'Female', role:'Life Assured', relation:'Self', riskIndicator:'Low', idNumber:'CCAPR4321E', panNo:'CCAPR4321E', panValidFlag:'Valid', flat:'5B', road:'JP Nagar', area:'JP Nagar 7th Phase', city:'Bengaluru', state:'Karnataka', country:'India', pincode:'560078', telNo:'', mobileNo:'9845612300', emailId:'sunita.rao@email.com', nationality:'Indian', status:'Deceased' },
      { clientId:'CL-0012', name:'Vikram', lastName:'Rao', dob:'1978-04-10', gender:'Male', role:'Nominee', relation:'Spouse', riskIndicator:'Low', idNumber:'DDAPR8765F', panNo:'DDAPR8765F', panValidFlag:'Valid', flat:'5B', road:'JP Nagar', area:'JP Nagar 7th Phase', city:'Bengaluru', state:'Karnataka', country:'India', pincode:'560078', telNo:'', mobileNo:'9845612301', emailId:'vikram.rao@email.com', nationality:'Indian', status:'Alive' },
    ],
    riders:[], agentRepudiation:[],
  },
}

export const CAUSE_EVENTS = [
  { causeCode:'D001', causeDescription:'Natural Death', causeCategory:'Natural', claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D002', causeDescription:'Accidental Death', causeCategory:'Accidental', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D003', causeDescription:'Death due to Illness', causeCategory:'Medical', claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D004', causeDescription:'Cardiac Arrest', causeCategory:'Medical', claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D005', causeDescription:'Accidental Drowning', causeCategory:'Accidental', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D006', causeDescription:'Road Accident', causeCategory:'Accidental', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D007', causeDescription:'Cancer', causeCategory:'Medical', claimSubType:'Death', claimRegistrationType:'Normal' },
  { causeCode:'D008', causeDescription:'Suicide', causeCategory:'Intentional', claimSubType:'Death', claimRegistrationType:'Investigation' },
  { causeCode:'D009', causeDescription:'Others', causeCategory:'Others', claimSubType:'Death', claimRegistrationType:'Normal' },
]

export const ASSESSMENT_QUESTIONS = [
  { id:1, question:'Was the claim reported within 30 days of the event?', section:'Reporting' },
  { id:2, question:'Does the cause of death match the policy coverage terms?', section:'Eligibility' },
  { id:3, question:'Is the nominee correctly mentioned in the policy document?', section:'Nomination' },
  { id:4, question:'Are all mandatory documents submitted?', section:'Documentation' },
  { id:5, question:'Were any previous claims registered on this policy?', section:'History' },
  { id:6, question:'Was there any medical history of serious illness prior to policy commencement?', section:'Medical' },
  { id:7, question:'Was the life assured employed at the time of death?', section:'Personal' },
  { id:8, question:'Are there any other active life insurance policies for the life assured?', section:'Disclosure' },
  { id:9, question:'Was the death witnessed by any person?', section:'Circumstances' },
  { id:10, question:'Has the claimant provided any police FIR or post-mortem report?', section:'Legal' },
  { id:11, question:'Is there any suspicion of fraud or misrepresentation?', section:'Fraud' },
  { id:12, question:'Does the address on documents match the policy records?', section:'Verification' },
]

export const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh']

export const PLACES_OF_DEATH = ['Hospital','Home','Public Place','Road Accident Site','Workplace','Religious Place','Forest/Jungle','Water Body','Railway Station','Airport','Others']

/* ── Mock API functions ── */
export const fetchPolicyDetails = (policyId) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const policy = POLICY_DB[policyId]
      if (policy) resolve(policy)
      else reject(new Error(`Policy ${policyId} not found`))
    }, 800)
  })

export const fetchCauseEvents = () =>
  new Promise(resolve => setTimeout(() => resolve(CAUSE_EVENTS), 400))

export const generateTrapScore = (params) =>
  new Promise(resolve => {
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 20
      const risk = score >= 50 ? 'High' : score >= 30 ? 'Medium' : 'Low'
      resolve({ trapScore: score, trapRisk: risk, trapRemarks: `Auto-generated trap score based on ${Object.keys(params).length} parameters. Risk level: ${risk}.`, trapDate: new Date().toISOString().split('T')[0] })
    }, 1200)
  })

export const generateSystemDecision = (policyData) =>
  new Promise(resolve => {
    setTimeout(() => {
      const hasAllDocs = true
      const isWithinTerm = true
      const recs = isWithinTerm && hasAllDocs ? 'Approve' : 'Refer'
      resolve({ recommendation: recs, payableAmount: policyData.sumAssured || 1250000, reason: `Policy is ${isWithinTerm ? 'within' : 'outside'} coverage period. All submitted documents verified. Cause of death aligns with policy terms. No fraud indicators detected.`, riskScore: 'Low', processedOn: new Date().toISOString().split('T')[0] })
    }, 1000)
  })

export const registerClaim = (policyData) =>
  new Promise(resolve => {
    setTimeout(() => {
      const claimNo = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      resolve({ claimNo, status: 'Registered', message: `Claim ${claimNo} registered successfully. Assigned for assessment.` })
    }, 1500)
  })

/* ── Mock claim details (for read-only view) ── */
export const CLAIM_DETAILS = {
  'CLM-2025-0041': {
    claimId:'CLM-2025-0041', policyId:'POL-78432', status:'Pending', priority:'High', daysOpen:5,
    claimType:'Death', informationType:'Written Information',
    intimationDate:'2025-05-28', source:'Branch', bondType:'Policy Bond', firPmReceived:'Yes', declaredByDoctor:'Yes',
    dateOfDeathEvent:'2025-05-20', dateOfDeathReg:'2025-05-22', placeOfDeath:'Hospital',
    deathCertificate:'Printed', dcRegNumber:'DC-2025-1234', dcIssueDistrict:'Mumbai', dcIssueState:'Maharashtra',
    causeCode:'D004', causeDescription:'Cardiac Arrest', causeCategory:'Medical', causeSubType:'Death',
    laName:'Ramesh Patel', laDob:'1975-03-15', laGender:'Male', laCity:'Mumbai', laState:'Maharashtra',
    payeeName:'Sunita', payeeLastName:'Patel', payeeMobileNo:'9876543211', payeeRelation:'Spouse', payeeStatus:'Alive',
    claimants:[{ name:'Sunita Patel', role:'Nominee', relation:'Spouse', mobileNo:'9876543211', panNo:'BBAPB5678D' }],
    productName:'Endowment Plus', sumAssured:1250000, premiumStatus:'Active',
    advisorCode:'ADV-12345', uwDecision:'Standard',
    hospitalDetails:[{ hospitalName:'Lilavati Hospital', admissionDate:'2025-05-18', dischargeDate:'2025-05-20', diagnosis:'Cardiac Arrest', natureOfIllness:'Acute' }],
    doctorDetails:[{ doctorName:'Dr. Suresh Mehta', regNo:'MCI-12345', qualification:'MD', firstConsultDate:'2025-05-18', causeOfDeath:'Cardiac Arrest' }],
    proofDetails:[{ proofType:'Identity', documentType:'Aadhaar', documentId:'1234-5678-9012', issueDate:'2020-01-15', holderName:'Ramesh Patel' }],
    witnessDetails:[],
    reqStatus:{ 1:'Received', 2:'Received', 3:'Received', 4:'Pending', 5:'Pending', 6:'Received', 7:'Pending' },
    assessmentAnswers:{ 1:'Yes', 2:'Yes', 3:'Yes', 4:'Yes', 5:'No', 6:'No', 7:'Yes', 8:'No' },
    caseTrigger:'No', priorityFlag:'High', assessorRemarks:'Claim appears genuine. All primary documents received.',
    sysRecommendation:'Approve', sysPayableAmount:1250000, sysRiskScore:'Low', sysProcessedOn:'2025-05-30',
    accessorDecision:'', accessorReason:'', accessorAmount:'',
    auditTrail:[
      { action:'Claim Registered', by:'Priya Sharma', role:'Pre Assessor', date:'2025-05-28 09:15', remarks:'Initial registration' },
      { action:'Assigned to Assessor', by:'System', role:'System', date:'2025-05-28 09:16', remarks:'Auto-assigned to pool' },
      { action:'Assessment Started', by:'Rahul Mehta', role:'Assessor', date:'2025-05-29 10:30', remarks:'Picked from pool' },
    ],
  },
  'CLM-2025-0040': {
    claimId:'CLM-2025-0040', policyId:'POL-65219', status:'Approved', priority:'Normal', daysOpen:4,
    claimType:'Death', informationType:'Written Information',
    intimationDate:'2025-05-25', source:'Email', bondType:'Policy Bond', firPmReceived:'No', declaredByDoctor:'Yes',
    dateOfDeathEvent:'2025-05-22', dateOfDeathReg:'2025-05-23', placeOfDeath:'Hospital',
    deathCertificate:'Printed', dcRegNumber:'DC-2025-0988', dcIssueDistrict:'Bengaluru', dcIssueState:'Karnataka',
    causeCode:'D003', causeDescription:'Death due to Illness', causeCategory:'Medical', causeSubType:'Death',
    laName:'Sunita Rao', laDob:'1980-07-22', laGender:'Female', laCity:'Bengaluru', laState:'Karnataka',
    payeeName:'Vikram', payeeLastName:'Rao', payeeMobileNo:'9845612301', payeeRelation:'Spouse', payeeStatus:'Alive',
    claimants:[{ name:'Vikram Rao', role:'Nominee', relation:'Spouse', mobileNo:'9845612301', panNo:'DDAPR8765F' }],
    productName:'Term Protect', sumAssured:800000, premiumStatus:'Active',
    advisorCode:'ADV-67890', uwDecision:'Standard',
    hospitalDetails:[{ hospitalName:'Manipal Hospital', admissionDate:'2025-05-19', dischargeDate:'2025-05-22', diagnosis:'Respiratory Failure', natureOfIllness:'Chronic' }],
    doctorDetails:[{ doctorName:'Dr. Kavitha Nair', regNo:'KMC-56789', qualification:'MBBS', firstConsultDate:'2025-05-15', causeOfDeath:'Respiratory Failure' }],
    proofDetails:[{ proofType:'Identity', documentType:'PAN', documentId:'CCAPR4321E', issueDate:'2018-06-01', holderName:'Sunita Rao' }],
    witnessDetails:[],
    reqStatus:{ 1:'Received', 2:'Received', 3:'Received', 4:'Received', 5:'Received', 6:'Received', 7:'Received' },
    assessmentAnswers:{ 1:'Yes', 2:'Yes', 3:'Yes', 4:'Yes', 5:'No', 6:'Yes', 7:'Yes', 8:'No' },
    caseTrigger:'No', priorityFlag:'Normal', assessorRemarks:'All documents verified. Claim is valid.',
    sysRecommendation:'Approve', sysPayableAmount:800000, sysRiskScore:'Low', sysProcessedOn:'2025-05-27',
    accessorDecision:'Approve', accessorReason:'All documents in order, cause of death matches policy terms.', accessorAmount:'800000',
    auditTrail:[
      { action:'Claim Registered', by:'Priya Sharma', role:'Pre Assessor', date:'2025-05-25 10:00', remarks:'Initial registration' },
      { action:'Approved', by:'Anita Desai', role:'Verifier', date:'2025-05-29 14:30', remarks:'Claim approved after verification' },
    ],
  },
}

export const fetchClaimDetails = (claimId) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const claim = CLAIM_DETAILS[claimId]
      if (claim) resolve(claim)
      else resolve({ claimId, status:'Pending', claimType:'Death', laName:'Sample Claimant', sumAssured:1000000, policyId:'POL-00001', auditTrail:[] })
    }, 600)
  })

export const updateClaimStatus = (claimId, status, remarks) =>
  new Promise(resolve => setTimeout(() => resolve({ success:true, claimId, status, remarks }), 800))

export const AUDIT_LOGS = [
  { id:1, user:'Priya Sharma', role:'Pre Assessor', action:'Login', ip:'192.168.1.10', timestamp:'2026-06-03 09:00:12', session:'SES-001' },
  { id:2, user:'Rahul Mehta', role:'Assessor', action:'Login', ip:'192.168.1.15', timestamp:'2026-06-03 09:05:34', session:'SES-002' },
  { id:3, user:'Priya Sharma', role:'Pre Assessor', action:'Claim Registered', ip:'192.168.1.10', timestamp:'2026-06-03 09:15:22', session:'SES-001' },
  { id:4, user:'Rahul Mehta', role:'Assessor', action:'Claim Viewed', ip:'192.168.1.15', timestamp:'2026-06-03 10:30:44', session:'SES-002' },
  { id:5, user:'Anita Desai', role:'Verifier', action:'Login', ip:'192.168.1.20', timestamp:'2026-06-03 11:00:01', session:'SES-003' },
  { id:6, user:'Anita Desai', role:'Verifier', action:'Claim Approved', ip:'192.168.1.20', timestamp:'2026-06-03 11:45:33', session:'SES-003' },
  { id:7, user:'Suresh Kumar', role:'Super User', action:'Login', ip:'192.168.1.5', timestamp:'2026-06-03 12:00:00', session:'SES-004' },
  { id:8, user:'Suresh Kumar', role:'Super User', action:'User Created', ip:'192.168.1.5', timestamp:'2026-06-03 12:00:00', session:'SES-004' },
  { id:9, user:'Rahul Mehta', role:'Assessor', action:'Logout', ip:'192.168.1.15', timestamp:'2026-06-03 13:00:00', session:'SES-002' },
  { id:10, user:'Priya Sharma', role:'Pre Assessor', action:'Logout', ip:'192.168.1.10', timestamp:'2026-06-03 13:30:00', session:'SES-001' },
]
