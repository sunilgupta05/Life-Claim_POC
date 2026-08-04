import { describe, it, expect } from 'vitest';
import { statusToGridTone } from './statusBadgeTone';

describe('statusToGridTone', () => {
  it('maps rejected / repudiated statuses to "rejected"', () => {
    expect(statusToGridTone('Claim Rejected')).toBe('rejected');
    expect(statusToGridTone('Repudiated')).toBe('rejected');
  });

  it('maps approved / payout-completed to "approved"', () => {
    expect(statusToGridTone('Approved')).toBe('approved');
    expect(statusToGridTone('Payout Completed')).toBe('approved');
  });

  it('maps pending-verifier to "info" and other pending to "pending"', () => {
    expect(statusToGridTone('Pending Verifier')).toBe('info');
    expect(statusToGridTone('Pending Assessor')).toBe('pending');
  });

  it('falls back to "neutral" for unknown / empty status', () => {
    expect(statusToGridTone('Something Else')).toBe('neutral');
    expect(statusToGridTone('')).toBe('neutral');
    expect(statusToGridTone(null)).toBe('neutral');
  });
});
