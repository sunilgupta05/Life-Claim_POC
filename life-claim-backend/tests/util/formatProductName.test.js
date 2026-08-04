const { formatProductName } = require('../../src/util/formatProductName');

describe('formatProductName', () => {
  test('strips the "ICICI Pru" insurer prefix', () => {
    expect(formatProductName('ICICI Pru Super Protect Credit')).toBe('Super Protect Credit');
  });

  test('leaves names without the prefix unchanged', () => {
    expect(formatProductName('Super Protect Credit')).toBe('Super Protect Credit');
  });

  test('passes null / empty / placeholder values through', () => {
    expect(formatProductName(null)).toBeNull();
    expect(formatProductName('')).toBe('');
    expect(formatProductName('N/A')).toBe('N/A');
    expect(formatProductName('—')).toBe('—');
  });
});
