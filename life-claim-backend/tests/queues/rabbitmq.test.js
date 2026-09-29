// tests/queues/rabbitmq.test.js
//
// RabbitMQ hardening (roadmap 3.6): the pure retry/dead-letter decision and the
// auxiliary queue naming. No broker connection is made (getChannel is lazy).

process.env.LOG_TO_FILE = 'false';
const { nextDelivery, retryQueue, dlqQueue } = require('../../src/queues/rabbitmq');

describe('nextDelivery — bounded retry with dead-letter', () => {
  test('first failure (no header) retries with count 1', () => {
    expect(nextDelivery({}, 3)).toEqual({ action: 'retry', retryCount: 1 });
    expect(nextDelivery(undefined, 3)).toEqual({ action: 'retry', retryCount: 1 });
  });

  test('increments the retry counter each attempt', () => {
    expect(nextDelivery({ 'x-retry-count': 1 }, 3)).toEqual({ action: 'retry', retryCount: 2 });
    expect(nextDelivery({ 'x-retry-count': 2 }, 3)).toEqual({ action: 'retry', retryCount: 3 });
  });

  test('dead-letters once the max is reached', () => {
    expect(nextDelivery({ 'x-retry-count': 3 }, 3)).toEqual({ action: 'deadletter', retryCount: 3 });
    expect(nextDelivery({ 'x-retry-count': 9 }, 3)).toEqual({ action: 'deadletter', retryCount: 9 });
  });

  test('non-numeric header is treated as zero', () => {
    expect(nextDelivery({ 'x-retry-count': 'nan' }, 2)).toEqual({ action: 'retry', retryCount: 1 });
  });
});

describe('auxiliary queue naming', () => {
  test('retry + dlq derive from the base queue', () => {
    expect(retryQueue('notifications')).toBe('notifications.retry');
    expect(dlqQueue('notifications')).toBe('notifications.dlq');
  });
});
