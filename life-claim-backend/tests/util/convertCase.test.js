const {
  camelToSnakeCase,
  snakeToCamelCase,
  sanitizeDbDate,
  sanitizeDateFields,
} = require('../../src/util/convertCase');

describe('convertCase', () => {
  test('camelToSnakeCase converts keys to UPPER_SNAKE_CASE', () => {
    expect(camelToSnakeCase({ claimNumber: 1, policyHolderName: 'x' })).toEqual({
      CLAIM_NUMBER: 1,
      POLICY_HOLDER_NAME: 'x',
    });
  });

  test('snakeToCamelCase converts keys back to camelCase', () => {
    expect(snakeToCamelCase({ CLAIM_NUMBER: 1, POLICY_HOLDER_NAME: 'x' })).toEqual({
      claimNumber: 1,
      policyHolderName: 'x',
    });
  });

  describe('sanitizeDbDate', () => {
    test('passes a valid ISO date through unchanged', () => {
      expect(sanitizeDbDate('2026-08-03')).toBe('2026-08-03');
    });

    test('nulls out NA / blank / invalid / null inputs', () => {
      expect(sanitizeDbDate('NA')).toBeNull();
      expect(sanitizeDbDate('N/A')).toBeNull();
      expect(sanitizeDbDate('')).toBeNull();
      expect(sanitizeDbDate('invalid date')).toBeNull();
      expect(sanitizeDbDate(null)).toBeNull();
    });
  });

  test('sanitizeDateFields only touches the listed keys', () => {
    expect(sanitizeDateFields({ dob: 'NA', name: 'x' }, ['dob'])).toEqual({
      dob: null,
      name: 'x',
    });
  });
});
