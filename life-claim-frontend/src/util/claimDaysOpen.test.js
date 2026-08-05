import { describe, it, expect } from 'vitest';
import {
  parseClaimDate,
  matchesDateFilter,
  formatClaimDate,
  isTerminalClaimStatus,
  computeDaysOpen,
  buildClaimTimelineSteps,
} from './claimDaysOpen';

describe('claimDaysOpen', () => {
  describe('parseClaimDate', () => {
    it('parses ISO and MySQL datetime strings', () => {
      expect(parseClaimDate('2026-08-01')).toBeInstanceOf(Date);
      expect(parseClaimDate('2026-08-01 10:30:00')).toBeInstanceOf(Date);
    });
    it('returns null for empty / invalid input', () => {
      expect(parseClaimDate('')).toBeNull();
      expect(parseClaimDate(null)).toBeNull();
      expect(parseClaimDate('not-a-date')).toBeNull();
    });
  });

  describe('isTerminalClaimStatus', () => {
    it('flags closed statuses', () => {
      expect(isTerminalClaimStatus('Approved')).toBe(true);
      expect(isTerminalClaimStatus('Payout Completed')).toBe(true);
      expect(isTerminalClaimStatus('Rejected')).toBe(true);
    });
    it('is false for in-progress statuses', () => {
      expect(isTerminalClaimStatus('Pending Assessor')).toBe(false);
      expect(isTerminalClaimStatus('')).toBe(false);
    });
  });

  describe('formatClaimDate', () => {
    it('formats to YYYY-MM-DD', () => {
      expect(formatClaimDate('2026-08-01T10:00:00.000Z')).toBe('2026-08-01');
    });
    it('returns an em dash for missing input', () => {
      expect(formatClaimDate(null)).toBe('—');
    });
  });

  describe('computeDaysOpen', () => {
    it('counts calendar days to modified date when the claim is closed', () => {
      expect(computeDaysOpen('2026-08-01', '2026-08-06', 'Approved')).toBe(5);
    });
    it('returns 0 when there is no start date', () => {
      expect(computeDaysOpen(null, null, 'Pending')).toBe(0);
    });
  });

  describe('matchesDateFilter', () => {
    it('always matches for "All"', () => {
      expect(matchesDateFilter('2000-01-01', 'All')).toBe(true);
    });
    it('matches today for the "Today" filter and rejects old dates', () => {
      const today = new Date().toISOString();
      expect(matchesDateFilter(today, 'Today')).toBe(true);
      expect(matchesDateFilter('2000-01-01', 'Today')).toBe(false);
    });
  });

  describe('buildClaimTimelineSteps', () => {
    it('always starts with "Claim Registered" and marks a terminal step done', () => {
      const steps = buildClaimTimelineSteps({ created: '2026-08-01', modified: '2026-08-06', status: 'Approved' });
      expect(steps[0].label).toBe('Claim Registered');
      expect(steps[steps.length - 1].done).toBe(true);
    });
  });
});
