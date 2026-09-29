// tests/util/resilience.test.js
//
// Deterministic, no-network tests for the roadmap 3.1 resilience helper:
//   - happy path passes the value through
//   - transient failures are retried with backoff, then succeed
//   - client (4xx) errors are NOT retried
//   - after repeated failures the breaker OPENS and then fails fast
//   - listBreakers() reports per-integration state/stats
//
// Backoff is driven by a tiny retryBaseMs override so the suite stays fast and
// uses real timers (opossum also schedules timers internally, so we avoid fake
// timers here).

const {
  run,
  getBreaker,
  listBreakers,
  isOpenBreakerError,
  __resetForTests,
} = require('../../src/util/resilience');

const clientError = (status) => {
  const err = new Error(`HTTP ${status}`);
  err.response = { status };
  return err;
};

beforeEach(() => {
  __resetForTests();
});

afterAll(() => {
  __resetForTests();
});

describe('resilience.run', () => {
  test('returns the resolved value on success (no retry)', async () => {
    const fn = jest.fn(() => Promise.resolve('ok'));
    await expect(run('t-success', fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries a transient failure and then succeeds', async () => {
    let calls = 0;
    const fn = jest.fn(() => {
      calls += 1;
      if (calls < 2) return Promise.reject(new Error('ECONNRESET')); // transient, no HTTP status
      return Promise.resolve('recovered');
    });
    await expect(
      run('t-retry', fn, { retries: 2, retryBaseMs: 1 })
    ).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('does NOT retry a client (4xx) error and surfaces it', async () => {
    const fn = jest.fn(() => Promise.reject(clientError(400)));
    await expect(
      run('t-4xx', fn, { retries: 3, retryBaseMs: 1 })
    ).rejects.toThrow('HTTP 400');
    expect(fn).toHaveBeenCalledTimes(1); // no retries on a 4xx
  });

  test('opens the breaker after repeated failures, then fails fast', async () => {
    const name = 't-breaker';
    const fn = jest.fn(() => Promise.reject(new Error('boom'))); // transient 5xx-like
    const opts = {
      retries: 0,
      retryBaseMs: 1,
      volumeThreshold: 1,
      errorThresholdPercentage: 1,
      resetTimeout: 60000, // stays open for the duration of the test
    };

    // Drive enough failures to trip the breaker.
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await run(name, fn, opts).catch(() => {});
    }

    const breaker = getBreaker(name);
    expect(breaker.opened).toBe(true);

    const callsBefore = fn.mock.calls.length;
    let failFastErr;
    await run(name, fn, opts).catch((e) => {
      failFastErr = e;
    });

    expect(isOpenBreakerError(failFastErr)).toBe(true);
    // Fail-fast: the underlying fn is not invoked while the breaker is open.
    expect(fn.mock.calls.length).toBe(callsBefore);
  });

  test('listBreakers() reports registered breakers with state + stats', async () => {
    await run('t-list', () => Promise.resolve(1));
    const list = listBreakers();
    const entry = list.find((b) => b.name === 't-list');
    expect(entry).toBeTruthy();
    expect(entry.state).toBe('closed');
    expect(entry.healthy).toBe(true);
    expect(entry.stats).toEqual(
      expect.objectContaining({
        fires: expect.any(Number),
        successes: expect.any(Number),
        failures: expect.any(Number),
        timeouts: expect.any(Number),
        rejects: expect.any(Number),
      })
    );
  });
});
