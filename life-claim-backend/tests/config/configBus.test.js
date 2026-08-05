// Tests the config invalidation bus (roadmap 0.4) in its DISABLED (no-Redis) mode:
// every function must be a safe no-op so single-instance installs are unaffected.
const configBus = require('../../src/config/configBus');

describe('configBus (no REDIS_URL => no-op)', () => {
  test('is disabled before init', () => {
    expect(configBus.isEnabled()).toBe(false);
  });

  test('init() with no url resolves false and never throws', async () => {
    await expect(configBus.init(undefined, () => {})).resolves.toBe(false);
    expect(configBus.isEnabled()).toBe(false);
  });

  test('publish() is a safe no-op when disabled', () => {
    expect(() => configBus.publish('SOME_KEY')).not.toThrow();
    expect(() => configBus.publish()).not.toThrow();
  });

  test('exposes a stable channel and a per-process instance id', () => {
    expect(typeof configBus.CHANNEL).toBe('string');
    expect(configBus.CHANNEL.length).toBeGreaterThan(0);
    expect(configBus.INSTANCE_ID).toMatch(/^[0-9a-f]+$/i);
  });
});
