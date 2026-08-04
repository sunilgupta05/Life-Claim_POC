import { describe, it, expect } from 'vitest';
import { distributePercents, percentOf, withDisplayPercents } from './percentDisplay';

describe('percentDisplay', () => {
  describe('distributePercents', () => {
    it('always sums to 100 (largest-remainder method)', () => {
      const out = distributePercents([1, 1, 1], 3);
      expect(out.reduce((a, b) => a + b, 0)).toBe(100);
    });

    it('returns zeros when total is falsy', () => {
      expect(distributePercents([1, 2], 0)).toEqual([0, 0]);
    });
  });

  describe('percentOf', () => {
    it('rounds a single share to a whole percent', () => {
      expect(percentOf(1, 3)).toBe(33);
      expect(percentOf(1, 2)).toBe(50);
    });

    it('returns 0 when the total is 0', () => {
      expect(percentOf(5, 0)).toBe(0);
    });
  });

  describe('withDisplayPercents', () => {
    it('attaches a pct to each row that sums to 100', () => {
      const rows = withDisplayPercents([{ value: 2 }, { value: 2 }], 4);
      expect(rows.map((r) => r.pct).reduce((a, b) => a + b, 0)).toBe(100);
    });

    it('returns an empty array for no items', () => {
      expect(withDisplayPercents([], 10)).toEqual([]);
    });
  });
});
