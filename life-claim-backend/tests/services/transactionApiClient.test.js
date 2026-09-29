// tests/services/transactionApiClient.test.js — Transaction API client (roadmap 4.1).
// Integration mocked (axios) — no network.

process.env.LOG_TO_FILE = 'false';
jest.mock('axios');
const axios = require('axios');
const { __resetForTests } = require('../../src/util/resilience');
const txn = require('../../src/services/transactionApiClient');

afterEach(() => { __resetForTests(); jest.clearAllMocks(); });

describe('formatPolicyNumber', () => {
  test('pads to 8 digits', () => {
    expect(txn.formatPolicyNumber('123')).toBe('00000123');
    expect(txn.formatPolicyNumber('12345678')).toBe('12345678');
    expect(txn.formatPolicyNumber('')).toBe('');
  });
});

describe('buildPolicySearchUrl', () => {
  test('builds the policySearch path with a padded number', () => {
    expect(txn.buildPolicySearchUrl('42')).toMatch(/\/api\/policy\/policySearch\/00000042$/);
  });
});

describe('fetchPolicySearch', () => {
  test('returns data + formatted number on success', async () => {
    axios.get.mockResolvedValue({ data: { FinalElement: { ContractDetails: [{}] } } });
    const res = await txn.fetchPolicySearch('42');
    expect(res.formattedPolicyNo).toBe('00000042');
    expect(res.data.FinalElement.ContractDetails).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('throws when policy number is empty', async () => {
    await expect(txn.fetchPolicySearch('')).rejects.toThrow(/required/i);
  });
});

describe('assertPolicySearchHasData', () => {
  test('passes when contract or life-assured present', () => {
    expect(() => txn.assertPolicySearchHasData({ FinalElement: { ContractDetails: [{}] } }, '1')).not.toThrow();
  });
  test('throws when neither present', () => {
    expect(() => txn.assertPolicySearchHasData({ FinalElement: {} }, '00000001')).toThrow(/not found/i);
  });
});
