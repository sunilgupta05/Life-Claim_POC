// tests/services/rulesEngineClient.test.js — Drools rules client (roadmap 4.1). axios mocked.

process.env.LOG_TO_FILE = 'false';
jest.mock('axios');
const axios = require('axios');
const { __resetForTests } = require('../../src/util/resilience');
const rules = require('../../src/services/rulesEngineClient');

afterEach(() => { __resetForTests(); jest.clearAllMocks(); });

describe('rulesEngineClient', () => {
  test('getRulesEngineBase strips a trailing slash', () => {
    process.env.RULES_ENGINE_URL = 'http://rules:8095/';
    expect(rules.getRulesEngineBase()).toBe('http://rules:8095');
    delete process.env.RULES_ENGINE_URL;
  });

  test('isRulesEngineEnabled defaults true', () => {
    expect(rules.isRulesEngineEnabled()).toBe(true);
  });

  test('evaluateAddExclusion posts facts and returns the engine result', async () => {
    axios.post.mockResolvedValue({ data: { excluded: true, exclusionType: 'INTOXICATION' } });
    const out = await rules.evaluateAddExclusion({ hasContractDetails: true, rcdYears: 1 });
    expect(out).toEqual({ excluded: true, exclusionType: 'INTOXICATION' });
    const [url, facts, cfg] = axios.post.mock.calls[0];
    expect(url).toMatch(/\/api\/rules\/add-exclusion$/);
    expect(facts).toMatchObject({ hasContractDetails: true });
    expect(cfg.headers['X-Internal-Api-Key']).toBeTruthy(); // secret injected
  });
});
