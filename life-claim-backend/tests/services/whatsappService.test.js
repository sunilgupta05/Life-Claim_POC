// tests/services/whatsappService.test.js — WhatsApp client (roadmap 4.1). axios mocked.

process.env.LOG_TO_FILE = 'false';
process.env.WHATSAPP_RETRIES = '0'; // don't retry in tests
jest.mock('axios');
const axios = require('axios');
const { __resetForTests } = require('../../src/util/resilience');
const wa = require('../../src/services/whatsappService');

afterEach(() => { __resetForTests(); jest.clearAllMocks(); });

describe('sendGenericNotification', () => {
  test('success path returns { success: true }', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'x' }] } });
    const res = await wa.sendGenericNotification('9876543210', 'hi');
    expect(res.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
    // normalized to country-code numeric (no '+'), masked in logs but sent raw
    const [, payload] = axios.post.mock.calls[0];
    expect(payload.to).toMatch(/^91\d+/);
    expect(payload.type).toBe('text');
  });

  test('failure path is caught → { success: false }', async () => {
    const err = new Error('bad request'); err.response = { status: 400 };
    axios.post.mockRejectedValue(err);
    const res = await wa.sendGenericNotification('9876543210', 'hi');
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });

  test('registration notification normalizes a leading-zero number', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await wa.sendClaimRegistrationNotification('09867000000', 'Ravi', 'CL1');
    const [, payload] = axios.post.mock.calls[0];
    expect(payload.to.startsWith('91')).toBe(true);
    expect(payload.to).not.toContain('+');
  });
});
