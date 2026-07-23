export const mockClaims = [
  { id: 'CLM-2025-0041', policy: 'POL-78432', claimant: 'Ramesh Patel',  type: 'Death Claim',    status: 'Pending',  amount: 1250000, created: '2025-05-28', modified: '2025-05-30', priority: 'High',   daysOpen: 5 },
  { id: 'CLM-2025-0040', policy: 'POL-65219', claimant: 'Sunita Rao',    type: 'Death Claim',    status: 'Approved', amount: 800000,  created: '2025-05-25', modified: '2025-05-29', priority: 'Normal', daysOpen: 4 },
  { id: 'CLM-2025-0039', policy: 'POL-91034', claimant: 'Vikram Singh',  type: 'Maturity Claim', status: 'Rejected', amount: 575000,  created: '2025-05-22', modified: '2025-05-28', priority: 'Normal', daysOpen: 6 },
  { id: 'CLM-2025-0038', policy: 'POL-44561', claimant: 'Meena Joshi',   type: 'Death Claim',    status: 'Pending',  amount: 2000000, created: '2025-05-20', modified: '2025-05-27', priority: 'High',   daysOpen: 12 },
  { id: 'CLM-2025-0037', policy: 'POL-33287', claimant: 'Anil Gupta',    type: 'Rider Claim',    status: 'Approved', amount: 325000,  created: '2025-05-18', modified: '2025-05-26', priority: 'Low',    daysOpen: 8 },
  { id: 'CLM-2025-0036', policy: 'POL-55123', claimant: 'Kavita Nair',   type: 'Death Claim',    status: 'Pending',  amount: 1500000, created: '2025-05-15', modified: '2025-05-25', priority: 'High',   daysOpen: 17 },
  { id: 'CLM-2025-0035', policy: 'POL-72841', claimant: 'Deepak Verma',  type: 'Maturity Claim', status: 'Approved', amount: 950000,  created: '2025-05-12', modified: '2025-05-22', priority: 'Normal', daysOpen: 3 },
  { id: 'CLM-2025-0034', policy: 'POL-19034', claimant: 'Pooja Iyer',    type: 'Death Claim',    status: 'Rejected', amount: 600000,  created: '2025-05-10', modified: '2025-05-20', priority: 'Normal', daysOpen: 10 },
  { id: 'CLM-2025-0033', policy: 'POL-82910', claimant: 'Suresh Naidu',  type: 'Rider Claim',    status: 'Pending',  amount: 275000,  created: '2025-05-30', modified: '2025-05-30', priority: 'Normal', daysOpen: 1 },
  { id: 'CLM-2025-0032', policy: 'POL-61045', claimant: 'Anjali Mehta',  type: 'Death Claim',    status: 'Pending',  amount: 1800000, created: '2025-05-29', modified: '2025-05-29', priority: 'High',   daysOpen: 2 },
]

export const mockMetrics = {
  total: 248,
  pending: 87,
  approved: 124,
  rejected: 37,
  totalValue: 48750000,
  slaCompliance: 91,
  avgDays: 3.2,
  overdueCount: 4,
}

export const mockChartData = [
  { name: 'Jan', approved: 18, rejected: 4, pending: 12 },
  { name: 'Feb', approved: 22, rejected: 5, pending: 15 },
  { name: 'Mar', approved: 19, rejected: 6, pending: 10 },
  { name: 'Apr', approved: 27, rejected: 3, pending: 18 },
  { name: 'May', approved: 24, rejected: 4, pending: 14 },
  { name: 'Jun', approved: 14, rejected: 2, pending: 18 },
]

export const mockPieData = [
  { name: 'Approved', value: 124, color: '#059669' },
  { name: 'Pending',  value: 87,  color: '#D97706' },
  { name: 'Rejected', value: 37,  color: '#DC2626' },
]

export const mockTypeData = [
  { name: 'Death Claim',    value: 142, color: '#1D4ED8' },
  { name: 'Maturity Claim', value: 68,  color: '#0891B2' },
  { name: 'Rider Claim',    value: 38,  color: '#7C3AED' },
]

export const mockActivity = [
  { id: 1, action: 'Claim Approved',        claim: 'CLM-2025-0040', user: 'Anita Desai',  time: '2h ago',  type: 'approved'   },
  { id: 2, action: 'New Claim Registered',  claim: 'CLM-2025-0041', user: 'Priya Sharma', time: '4h ago',  type: 'new'        },
  { id: 3, action: 'Claim Rejected',        claim: 'CLM-2025-0039', user: 'Rahul Mehta',  time: '6h ago',  type: 'rejected'   },
  { id: 4, action: 'Assessment Completed',  claim: 'CLM-2025-0038', user: 'Rahul Mehta',  time: '8h ago',  type: 'assessment' },
  { id: 5, action: 'Documents Uploaded',    claim: 'CLM-2025-0037', user: 'Priya Sharma', time: '1d ago',  type: 'document'   },
]

export const mockHighPriority = mockClaims.filter(c => c.priority === 'High' && c.status === 'Pending')

export const mockPolicies = [
  { policyId:'POL-78432', holderName:'Ramesh Patel',  dob:'1975-03-15', type:'Endowment',   sumAssured:1250000, startDate:'2010-06-01', premiumTerm:'20 years', status:'Active',  agent:'Suresh Kumar' },
  { policyId:'POL-65219', holderName:'Sunita Rao',    dob:'1980-07-22', type:'Term',        sumAssured:800000,  startDate:'2015-03-15', premiumTerm:'25 years', status:'Active',  agent:'Meena Gupta'  },
  { policyId:'POL-91034', holderName:'Vikram Singh',  dob:'1968-11-05', type:'ULIP',        sumAssured:575000,  startDate:'2008-09-01', premiumTerm:'10 years', status:'Matured', agent:'Anil Shah'    },
  { policyId:'POL-44561', holderName:'Meena Joshi',   dob:'1972-04-18', type:'Endowment',   sumAssured:2000000, startDate:'2012-01-20', premiumTerm:'25 years', status:'Active',  agent:'Priya Das'    },
  { policyId:'POL-33287', holderName:'Anil Gupta',    dob:'1983-09-30', type:'Money Back',  sumAssured:325000,  startDate:'2018-06-10', premiumTerm:'15 years', status:'Active',  agent:'Ravi Verma'   },
]

export const mockPool = [
  { claimId:'CLM-2025-0041', policyId:'POL-78432', claimant:'Ramesh Patel',  type:'Death Claim',  registeredDate:'2025-05-28', priority:'High',   status:'Unassigned', daysOpen:5  },
  { claimId:'CLM-2025-0038', policyId:'POL-44561', claimant:'Meena Joshi',   type:'Death Claim',  registeredDate:'2025-05-20', priority:'High',   status:'Unassigned', daysOpen:12 },
  { claimId:'CLM-2025-0036', policyId:'POL-55123', claimant:'Kavita Nair',   type:'Death Claim',  registeredDate:'2025-05-15', priority:'High',   status:'Unassigned', daysOpen:17 },
  { claimId:'CLM-2025-0033', policyId:'POL-82910', claimant:'Suresh Naidu',  type:'Rider Claim',  registeredDate:'2025-05-30', priority:'Normal', status:'Unassigned', daysOpen:1  },
  { claimId:'CLM-2025-0032', policyId:'POL-61045', claimant:'Anjali Mehta',  type:'Death Claim',  registeredDate:'2025-05-29', priority:'High',   status:'Unassigned', daysOpen:2  },
]

export const mockTasks = [
  { claimId:'CLM-2025-0040', policyId:'POL-65219', claimant:'Sunita Rao',   type:'Death Claim',    assignedDate:'2025-05-29', dueDate:'2025-06-02', priority:'Normal', status:'In Progress',   daysOpen:4, amount:800000  },
  { claimId:'CLM-2025-0037', policyId:'POL-33287', claimant:'Anil Gupta',   type:'Rider Claim',    assignedDate:'2025-05-26', dueDate:'2025-05-31', priority:'Low',    status:'Pending Review', daysOpen:8, amount:325000  },
  { claimId:'CLM-2025-0035', policyId:'POL-72841', claimant:'Deepak Verma', type:'Maturity Claim', assignedDate:'2025-05-22', dueDate:'2025-05-30', priority:'Normal', status:'In Progress',   daysOpen:3, amount:950000  },
]

export const mockUsers = [
  { id:1, name:'Priya Sharma',  username:'preassessor', email:'priya@dhdigital.co.in',   role:'Pre Assessor', status:'Active',   lastLogin:'2025-05-30', claimsHandled:48  },
  { id:2, name:'Rahul Mehta',   username:'assessor',    email:'rahul@dhdigital.co.in',   role:'Assessor',     status:'Active',   lastLogin:'2025-05-30', claimsHandled:124 },
  { id:3, name:'Anita Desai',   username:'verifier',    email:'anita@dhdigital.co.in',   role:'Verifier',     status:'Active',   lastLogin:'2025-05-29', claimsHandled:87  },
  { id:4, name:'Suresh Kumar',  username:'superuser',   email:'suresh@dhdigital.co.in',  role:'Super User',   status:'Active',   lastLogin:'2025-05-30', claimsHandled:0   },
  { id:5, name:'Kavita Nair',   username:'knaira',      email:'kavita@dhdigital.co.in',  role:'Pre Assessor', status:'Active',   lastLogin:'2025-05-28', claimsHandled:32  },
  { id:6, name:'Deepak Verma',  username:'dverma',      email:'deepak@dhdigital.co.in',  role:'Assessor',     status:'Inactive', lastLogin:'2025-05-20', claimsHandled:56  },
]

export const mockAddCases = [
  { caseId:'CASE-2025-001', claimId:'CLM-2025-0041', claimant:'Ramesh Patel',  type:'Death Claim',  registeredDate:'2025-05-28', assignedTo:'Unassigned',  status:'Open'        },
  { caseId:'CASE-2025-002', claimId:'CLM-2025-0038', claimant:'Meena Joshi',   type:'Death Claim',  registeredDate:'2025-05-20', assignedTo:'Rahul Mehta', status:'In Progress' },
  { caseId:'CASE-2025-003', claimId:'CLM-2025-0036', claimant:'Kavita Nair',   type:'Death Claim',  registeredDate:'2025-05-15', assignedTo:'Unassigned',  status:'Open'        },
  { caseId:'CASE-2025-004', claimId:'CLM-2025-0033', claimant:'Suresh Naidu',  type:'Rider Claim',  registeredDate:'2025-05-30', assignedTo:'Unassigned',  status:'Open'        },
]
