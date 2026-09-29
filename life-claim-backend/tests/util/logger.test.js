// tests/util/logger.test.js
//
// Centralized logger (roadmap 3.4): custom levels incl. fatal, runtime setLevel,
// and console-compatible variadic methods that never throw.

process.env.LOG_TO_FILE = 'false';
const logger = require('../../src/util/logger');

describe('logger', () => {
  test('exposes all severity methods incl. fatal/trace', () => {
    for (const m of ['fatal', 'error', 'warn', 'info', 'http', 'debug', 'trace', 'log']) {
      expect(typeof logger[m]).toBe('function');
    }
  });

  test('level set includes fatal at the top', () => {
    expect(logger.levels.fatal).toBe(0);
    expect(logger.levels.error).toBeGreaterThan(logger.levels.fatal);
  });

  test('setLevel accepts valid levels and rejects junk', () => {
    expect(logger.setLevel('warn')).toBe('warn');
    expect(logger.getLevel()).toBe('warn');
    expect(logger.setLevel('not-a-level')).toBeNull();
    expect(logger.getLevel()).toBe('warn'); // unchanged
    logger.setLevel('info'); // restore
  });

  test('variadic calls do not throw (console-compatible)', () => {
    expect(() => logger.info('a', 'b', { c: 1 }, [1, 2])).not.toThrow();
    expect(() => logger.error(new Error('boom'))).not.toThrow();
    expect(() => logger.log('plain console.log style', 42)).not.toThrow();
  });

  test('event() emits with structured meta without throwing', () => {
    expect(() => logger.event('warn', 'structured', { foo: 'bar' })).not.toThrow();
  });
});
