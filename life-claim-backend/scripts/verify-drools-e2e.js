/**
 * Parity check: JS fallback vs Drools for all ADD exclusion rules.
 * Run from life-claim-backend: node scripts/verify-drools-e2e.js
 */
require('dotenv').config();
const axios = require('axios');
const {
  applyExclusionRulesJs,
  loadExclusionMasterLists,
  checkForExclusionRule,
} = require('../src/services/add/exclusionRulesService');

const RULES_URL =
  (process.env.RULES_ENGINE_URL || 'http://localhost:8095').replace(/\/$/, '') +
  '/api/rules/add-exclusion';

const scenarios = [
  {
    name: 'RCD >= 3 years',
    facts: {
      contractPresent: true,
      lifeAssuredPresent: true,
      rcdYears: 5,
      claimType: 'Active',
      policyStatus: 'Active',
      annualPremium: 10000,
      premiumAmount: 1000,
      premiumFrequency: 1,
      productCode: 'A01',
      residentialStatus: 'I',
      advisorCode: '',
      partnerName: '',
      ageInYears: 40,
    },
    expectExcluded: true,
    expectType: 'RCD more than 3 years',
  },
  {
    name: 'NRI customer',
    facts: {
      contractPresent: true,
      lifeAssuredPresent: true,
      rcdYears: 1,
      residentialStatus: 'N',
      claimType: 'Active',
      policyStatus: 'Active',
      productCode: 'A01',
      ageInYears: 35,
    },
    expectExcluded: true,
    expectType: 'NRI customer',
  },
  {
    name: 'Minor life assured',
    facts: {
      contractPresent: true,
      lifeAssuredPresent: true,
      rcdYears: 1,
      residentialStatus: 'I',
      ageInYears: 16,
      claimType: 'Active',
      policyStatus: 'Active',
      productCode: 'A01',
    },
    expectExcluded: true,
    expectType: 'Minor Life Assured',
  },
  {
    name: 'Annual premium saving case',
    facts: {
      contractPresent: true,
      lifeAssuredPresent: true,
      rcdYears: 1,
      residentialStatus: 'I',
      ageInYears: 40,
      premiumAmount: 100000,
      premiumFrequency: 6,
      annualPremium: 600000,
      productCode: 'E123',
      claimType: 'Active',
      policyStatus: 'Active',
    },
    expectExcluded: true,
    expectType: 'Annual Premium > 5 lakh saving cases',
  },
  {
    name: 'Product norms G-prefix',
    facts: {
      contractPresent: true,
      lifeAssuredPresent: true,
      rcdYears: 1,
      residentialStatus: 'I',
      ageInYears: 40,
      productCode: 'G999',
      claimType: 'Active',
      policyStatus: 'Active',
    },
    expectExcluded: true,
    expectType: 'Product Norms',
  },
  {
    name: 'No exclusion — clean case',
    facts: {
      contractPresent: true,
      lifeAssuredPresent: true,
      rcdYears: 1,
      residentialStatus: 'I',
      ageInYears: 40,
      productCode: 'A01',
      premiumAmount: 1000,
      premiumFrequency: 1,
      annualPremium: 1000,
      claimType: 'Active',
      policyStatus: 'Active',
    },
    expectExcluded: false,
    expectType: null,
  },
];

async function callDrools(facts) {
  const { data } = await axios.post(RULES_URL, facts, { timeout: 10000 });
  return data;
}

async function runParityTests(masterLists) {
  const emptyLists = {
    claimReceivedValues: masterLists['Claim received'] || [],
    inactivePolicyStatusValues: masterLists['In-active policy status'] || [],
    topAdvisorValues: masterLists['Top advisor'] || [],
    partnerExclusionValues: masterLists['Partner Exclusion'] || [],
    productNormsValues: masterLists['Product Norms'] || [],
    ulipPolicyValues: masterLists['ULIP Policy'] || [],
  };

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    const facts = { ...emptyLists, ...scenario.facts, caseId: 0 };
    const js = applyExclusionRulesJs(facts);
    let drools;
    try {
      drools = await callDrools(facts);
    } catch (err) {
      console.log(`FAIL [${scenario.name}] Drools unreachable: ${err.message}`);
      failed += 1;
      continue;
    }

    const jsOk =
      js.exclusionApplied === scenario.expectExcluded &&
      (scenario.expectExcluded ? js.exclusionType === scenario.expectType : !js.exclusionType);
    const droolsOk =
      drools.excluded === scenario.expectExcluded &&
      (scenario.expectExcluded ? drools.exclusionType === scenario.expectType : !drools.exclusionType);
    const parityOk =
      js.exclusionApplied === drools.excluded &&
      (js.exclusionType || null) === (drools.exclusionType || null);

    if (jsOk && droolsOk && parityOk) {
      console.log(`PASS [${scenario.name}]`);
      passed += 1;
    } else {
      console.log(`FAIL [${scenario.name}]`);
      console.log('  expected:', scenario.expectExcluded, scenario.expectType);
      console.log('  js:    ', js);
      console.log('  drools:', drools);
      failed += 1;
    }
  }

  return { passed, failed };
}

async function runDbCaseCheck() {
  const db = require('../src/config/dbConfig');
  const [rows] = await db.query(
  `SELECT case_id FROM caps_add_details ORDER BY case_id DESC LIMIT 3`
  );
  if (!rows.length) {
    console.log('DB: no ADD cases found — skip live case check');
    return { passed: 0, failed: 0 };
  }

  let passed = 0;
  let failed = 0;
  for (const row of rows) {
    const caseId = row.case_id;
    try {
      const result = await checkForExclusionRule(caseId);
      const shapeOk =
        typeof result.exclusionApplied === 'boolean' &&
        (result.exclusionType === null || typeof result.exclusionType === 'string');
      if (shapeOk) {
        console.log(
          `PASS [DB case ${caseId}] excluded=${result.exclusionApplied} type=${result.exclusionType || '—'}`
        );
        passed += 1;
      } else {
        console.log(`FAIL [DB case ${caseId}] bad shape`, result);
        failed += 1;
      }
    } catch (err) {
      console.log(`FAIL [DB case ${caseId}] ${err.message}`);
      failed += 1;
    }
  }
  return { passed, failed };
}

async function main() {
  console.log('=== Drools E2E parity verification ===');
  console.log('Rules URL:', RULES_URL);
  console.log('RULES_ENGINE_ENABLED:', process.env.RULES_ENGINE_ENABLED !== 'false');

  try {
    const health = await axios.get(
      (process.env.RULES_ENGINE_URL || 'http://localhost:8095').replace(/\/$/, '') + '/api/health',
      { timeout: 5000 }
    );
    console.log('Health:', health.data);
  } catch (err) {
    console.error('Rules engine not reachable — start life-claim-rules first.');
    process.exit(1);
  }

  const masterLists = await loadExclusionMasterLists();
  const parity = await runParityTests(masterLists);
  const dbCheck = await runDbCaseCheck();

  const totalPassed = parity.passed + dbCheck.passed;
  const totalFailed = parity.failed + dbCheck.failed;

  console.log('---');
  console.log(`Result: ${totalPassed} passed, ${totalFailed} failed`);
  if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
