/** Normalize Life Asia policySearch payloads for v2 registration UI. */

import { formatProductName } from './formatProductName';

const formatDate = (value) => {
  if (!value) return null;
  try {
    const raw = typeof value === 'string' ? value.split('T')[0] : new Date(value).toISOString().split('T')[0];
    return raw && raw !== 'Invalid Date' ? raw : null;
  } catch {
    return null;
  }
};

const toNumber = (value) => {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const mapGender = (value) => {
  if (!value) return null;
  const code = String(value).toUpperCase();
  if (code === 'F' || code === 'FEMALE') return 'Female';
  if (code === 'M' || code === 'MALE') return 'Male';
  return value;
};

const splitName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { name: parts[0] || '', lastName: '' };
  return { name: parts[0], lastName: parts.slice(1).join(' ') };
};

const mapClient = (client) => {
  const explicitLast = client.LastName || client.lastName;
  const explicitFirst = client.Name || client.name || '';
  const { name, lastName } = explicitLast
    ? { name: explicitFirst, lastName: explicitLast }
    : splitName(explicitFirst);
  const country = client.Country || client.country || null;

  return {
    clientId: client.ClientID || client.ClientId || client.clientId || null,
    name: name || explicitFirst || null,
    lastName: lastName || null,
    dob: formatDate(client.DOB || client.dob),
    gender: mapGender(client.Gender || client.gender),
    role: client.Role || client.role || client.ClientType || client.clientType || '',
    relation: client.Relation || client.relation || '',
    panNo: client.PAN || client.panNo || null,
    idNumber: client.IDNumber || client.IdNumber || client.PAN || client.panNo || null,
    mobileNo: client.MobileNo != null ? String(client.MobileNo) : client.mobileNo || null,
    telNo: client.TelNo != null ? String(client.TelNo) : client.telNo || null,
    city: client.City || client.city || null,
    state: client.State || client.state || null,
    country,
    nationality: country === 'India' ? 'Indian' : country ? 'NRI' : null,
    pincode: client.Pincode != null ? String(client.Pincode) : client.pincode || null,
    flat: client.Flat || client.flat || null,
    road: client.Road || client.road || null,
    area: client.Area || client.area || null,
    emailId: client.Email || client.EmailId || client.emailId || null,
    riskIndicator: client.RiskIndicator || client.riskIndicator || null,
    status: client.LifeFlag || client.status || null,
    occCode: client.OccCode || client.occCode || null,
    occDesc: client.OccDesc || client.occDesc || client.Occupation || client.occupation || null,
    education: client.Education || client.education || null,
    income: client.Income != null ? String(client.Income) : client.income || null,
  };
};

const extractFinalElement = (apiResponse) => {
  if (!apiResponse || typeof apiResponse !== 'object') return {};
  if (apiResponse.FinalElement) return apiResponse.FinalElement;
  if (apiResponse.finalElement) return apiResponse.finalElement;
  if (apiResponse.data?.FinalElement) return apiResponse.data.FinalElement;
  return {};
};

const isAlreadyNormalized = (apiResponse) =>
  apiResponse &&
  typeof apiResponse === 'object' &&
  !apiResponse.FinalElement &&
  !apiResponse.finalElement &&
  !apiResponse.data?.FinalElement &&
  Boolean(apiResponse.policyId || apiResponse.productName || apiResponse.clients);

export function normalizePolicyResponse(apiResponse, policyNo = '') {
  if (isAlreadyNormalized(apiResponse)) {
    return apiResponse;
  }

  const finalElement = extractFinalElement(apiResponse);
  const contracts = finalElement.ContractDetails || finalElement.contractDetails || [];
  const contract = contracts[0] || {};
  const lifeAssuredBlock = finalElement.LifeAssured || finalElement.lifeAssured || {};
  const lifeAssuredClients = lifeAssuredBlock.ClientDetails || lifeAssuredBlock.clientDetails || [];

  const clients = lifeAssuredClients.map((client) => mapClient(client));

  const primaryClient = lifeAssuredClients[0] || clients[0] || {};
  const lifeAssuredName =
    [primaryClient.Name || primaryClient.name, primaryClient.LastName || primaryClient.lastName]
      .filter(Boolean)
      .join(' ') ||
    [clients[0]?.name, clients[0]?.lastName].filter(Boolean).join(' ') ||
    null;

  const sumAssured = toNumber(contract.SumAssured ?? contract.sumAssured ?? contract.BaseSA);
  const ecs =
    finalElement.ECSDetails ||
    finalElement.ecsDetails ||
    finalElement.BankDetails ||
    finalElement.bankDetails ||
    {};
  const ecsRow = Array.isArray(ecs) ? ecs[0] : ecs;

  const ridersRaw =
    finalElement.RiderDetails ||
    finalElement.riderDetails ||
    contract.RiderDetails ||
    contract.riderDetails ||
    [];

  const riders = (Array.isArray(ridersRaw) ? ridersRaw : []).map((rider) => ({
    riderCode: rider.RiderCode || rider.riderCode || rider.Code || null,
    riderSA: toNumber(rider.RiderSA ?? rider.SumAssured ?? rider.riderSA) || 0,
    riderRCD: formatDate(rider.RiderRCD || rider.RCD || rider.riderRCD),
    riderTerm: rider.RiderTerm || rider.Term || rider.riderTerm || null,
    riderStatus: rider.RiderStatus || rider.Status || rider.riderStatus || null,
    riderCessationDate: formatDate(rider.RiderCessationDate || rider.CessationDate),
  }));

  return {
    policyId:
      contract.PolicyNo ||
      contract.PolicyNumber ||
      contract.policyNo ||
      policyNo ||
      null,
    productCode: contract.ProductCode || contract.productCode || null,
    productName: formatProductName(contract.ProductName || contract.productName || null),
    sumAssured,
    issueDate: formatDate(contract.RCD || contract.IssueDate || contract.issueDate),
    riskCommencementDate: formatDate(contract.RCD || contract.PropRECDDate),
    paidToDate: formatDate(contract.PaidToDate || contract.PTD || contract.paidToDate),
    premiumStatus:
      contract.PolicyStatus || contract.CurrentStatus || contract.premiumStatus || null,
    premiumFrequency: contract.PremFreq != null ? String(contract.PremFreq) : contract.premiumFrequency || null,
    term: toNumber(contract.Term ?? contract.term),
    premPaidYrs: toNumber(contract.PremPaidYrs ?? contract.PremiumsPaid),
    totalPremiumPaid: toNumber(contract.TotalPremPaid ?? contract.totalPremiumPaid),
    currentSA: sumAssured,
    originalSA: sumAssured,
    cashValue: toNumber(contract.CashValue ?? contract.cashValue),
    maturityValue: toNumber(contract.MaturityValue ?? contract.maturityValue),
    advisorCode: contract.AdvisorCode || contract.advisorCode || null,
    advisorName: contract.AdvisorName || contract.advisorName || null,
    advisorStatus: contract.AdvisorStatus || contract.CurrentStatus || null,
    uwDecision: contract.UWDecision || contract.uwDecision || null,
    uwDecisionDate: formatDate(contract.UWDecisionDate || contract.uwDecisionDate),
    applicationNo: contract.ApplicationNo || contract.applicationNo || contract.AppNo || null,
    cdfDate: formatDate(contract.CDFDate || contract.CdfDate || contract.CDF_DATE),
    outstandingLoan: toNumber(
      contract.OutstandingLoan ?? contract.OutstandingLoanAmount ?? contract.OTSLoan ?? contract.outstandingLoan,
    ),
    excessPremium: toNumber(contract.ExcessPremium ?? contract.excessPremium),
    assignment: contract.Assignment || contract.assignment || null,
    salesChannel: contract.SalesChannel || contract.Channel || contract.salesChannel || null,
    ekitPrinted: contract.EKitPrinted || contract.ekitPrinted || null,
    agentMobile:
      contract.AdvisorMobile ||
      contract.AgentMobile ||
      contract.advisorMobile ||
      ecsRow?.MobileNo ||
      ecsRow?.mobileNo ||
      null,
    bankName: contract.BankName || ecsRow?.BankName || ecsRow?.bankName || null,
    accountNo:
      contract.AccountNo ||
      contract.AccountNumber ||
      contract.accountNo ||
      ecsRow?.AccountNo ||
      ecsRow?.accountNo ||
      null,
    accountOpenDate: formatDate(
      contract.AccountOpenDate || contract.accountOpenDate || ecsRow?.AccountOpenDate || ecsRow?.accountOpenDate,
    ),
    lifeAssuredName,
    laName: lifeAssuredName,
    clients,
    riders,
  };
}

const hasValue = (value) => value != null && String(value).trim() !== '' && value !== '—';

export function getPolicySummaryItems(policy, policyNo = '') {
  if (!policy) return [];

  const lifeAssured =
    policy.lifeAssuredName ||
    policy.laName ||
    [policy.clients?.[0]?.name, policy.clients?.[0]?.lastName].filter(Boolean).join(' ');

  const items = [
    { label: 'Policy', value: policy.policyId || policyNo, highlight: true },
    { label: 'Product', value: policy.productName },
    { label: 'Product code', value: policy.productCode },
    { label: 'Life assured', value: lifeAssured },
    {
      label: 'Sum assured',
      value:
        policy.sumAssured != null
          ? `₹${Number(policy.sumAssured).toLocaleString('en-IN')}`
          : null,
    },
    { label: 'Status', value: policy.premiumStatus },
    { label: 'Issue date', value: policy.issueDate },
  ];

  return items.filter((item) => hasValue(item.value));
}
