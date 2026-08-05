import { describe, it, expect } from 'vitest';
import { getWorkflowPoolRoles, defaultPoolRole } from './workflowRoles';

describe('workflowRoles', () => {
  describe('getWorkflowPoolRoles', () => {
    it('returns only the pool roles the user actually has', () => {
      expect(getWorkflowPoolRoles({ roles: ['Assessor', 'Something'] })).toEqual(['Assessor']);
      expect(getWorkflowPoolRoles({ roles: ['Verifier', 'Assessor'] })).toEqual(['Assessor', 'Verifier']);
    });
    it('supports a single `role` string', () => {
      expect(getWorkflowPoolRoles({ role: 'Verifier' })).toEqual(['Verifier']);
    });
    it('returns [] when there are no pool roles', () => {
      expect(getWorkflowPoolRoles({ roles: ['Admin'] })).toEqual([]);
      expect(getWorkflowPoolRoles({})).toEqual([]);
      expect(getWorkflowPoolRoles(null)).toEqual([]);
    });
  });

  describe('defaultPoolRole', () => {
    it('prefers Assessor when present', () => {
      expect(defaultPoolRole({ roles: ['Assessor', 'Verifier'] })).toBe('Assessor');
    });
    it('falls back to the only pool role', () => {
      expect(defaultPoolRole({ roles: ['Verifier'] })).toBe('Verifier');
    });
    it('defaults to Assessor when the user has no pool role', () => {
      expect(defaultPoolRole({})).toBe('Assessor');
    });
  });
});
