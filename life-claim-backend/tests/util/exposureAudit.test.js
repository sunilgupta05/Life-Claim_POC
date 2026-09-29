// tests/util/exposureAudit.test.js
//
// Segmentation self-audit (roadmap 3.7): auditExposure() returns structured
// findings and flags backend-only dependencies on non-private hosts.

process.env.LOG_TO_FILE = 'false';
const { auditExposure, isPrivateHost, hostOf } = require('../../src/util/exposureAudit');

describe('exposure audit helpers', () => {
  test('hostOf parses URLs and bare host:port', () => {
    expect(hostOf('http://192.168.60.62:3002/api/v1/')).toBe('192.168.60.62');
    expect(hostOf('192.168.60.63:8080')).toBe('192.168.60.63');
    expect(hostOf('amqp://10.0.0.5:5672')).toBe('10.0.0.5');
  });

  test('isPrivateHost distinguishes private vs public', () => {
    expect(isPrivateHost('127.0.0.1')).toBe(true);
    expect(isPrivateHost('localhost')).toBe(true);
    expect(isPrivateHost('192.168.1.10')).toBe(true);
    expect(isPrivateHost('203.0.113.7')).toBe(false);
  });
});

describe('auditExposure()', () => {
  test('returns an array of {level, area, message} findings', () => {
    const findings = auditExposure();
    expect(Array.isArray(findings)).toBe(true);
    for (const f of findings) {
      expect(f).toHaveProperty('level');
      expect(f).toHaveProperty('area');
      expect(f).toHaveProperty('message');
      expect(['info', 'warn']).toContain(f.level);
    }
  });

  test('flags a backend-only dependency pointed at a public host', () => {
    process.env.WHATSAPP_API_URL = 'http://203.0.113.9:3002/api/v1/';
    const findings = auditExposure();
    const hit = findings.find((f) => f.area === 'segmentation' && /203\.0\.113\.9/.test(f.message));
    expect(hit).toBeTruthy();
    delete process.env.WHATSAPP_API_URL;
  });
});
