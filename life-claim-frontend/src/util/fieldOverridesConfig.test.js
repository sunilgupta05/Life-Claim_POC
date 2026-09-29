// Tests for the Demographics field-config mechanism (roadmap 2.3 extension):
//  - missingConfiguredRequired(): additive required check (visible + config-required + empty)
//  - validateDemographicsSection(): a HIDDEN app-required field is not demanded

import { describe, it, expect } from 'vitest'
import { missingConfiguredRequired } from '../hooks/useFieldOverrides'
import { validateDemographicsSection } from './registrationValidation'

// Minimal cfg stub matching the useFieldOverrides shape.
const cfg = (overrides) => ({
  isHidden: (n) => overrides[n]?.visible === false,
  effectiveRequired: (n, base) => {
    const r = overrides[n]?.required
    return r === null || r === undefined ? !!base : !!r
  },
})

const CATALOG = [
  { name: 'a', label: 'Field A' },
  { name: 'b', label: 'Field B', readOnly: true },
  { name: 'c', label: 'Field C', required: true },
]

describe('missingConfiguredRequired', () => {
  it('flags a config-required, visible, empty field', () => {
    const out = missingConfiguredRequired(cfg({ a: { required: true } }), CATALOG, {})
    expect(out).toContain('Field A')
  })

  it('does not flag when the field has a value', () => {
    const out = missingConfiguredRequired(cfg({ a: { required: true } }), CATALOG, { a: 'x' })
    expect(out).not.toContain('Field A')
  })

  it('ignores hidden fields and read-only fields', () => {
    expect(missingConfiguredRequired(cfg({ a: { required: true, visible: false } }), CATALOG, {})).not.toContain('Field A')
    expect(missingConfiguredRequired(cfg({ b: { required: true } }), CATALOG, {})).not.toContain('Field B')
  })

  it('honours a base-required field (inherit)', () => {
    // c is base-required; no override → still required
    expect(missingConfiguredRequired(cfg({}), CATALOG, {})).toContain('Field C')
  })

  it('an admin can relax an EXTRA required back to optional', () => {
    expect(missingConfiguredRequired(cfg({ c: { required: false } }), CATALOG, {})).not.toContain('Field C')
  })
})

describe('validateDemographicsSection — hidden fields are not demanded', () => {
  it('normally requires intimation fields', () => {
    const { missing } = validateDemographicsSection('intimation', {}, {})
    expect(missing).toContain('Source')
  })

  it('does NOT require a field the admin hid (no soft-lock)', () => {
    const hiddenFields = new Set(['source', 'bondType'])
    const { missing } = validateDemographicsSection('intimation', {}, { hiddenFields })
    expect(missing).not.toContain('Source')
    expect(missing).not.toContain('Bond Type')
    // a still-visible required field is still demanded
    expect(missing).toContain('Intimation Date')
  })

  it('contract: hiding nameChangeDecl removes its requirement', () => {
    const base = validateDemographicsSection('contract', {}, { policy: { policyId: 'P' } })
    expect(base.missing).toContain('Name change declaration (Yes/No)')
    const hidden = validateDemographicsSection('contract', {}, { policy: { policyId: 'P' }, hiddenFields: new Set(['nameChangeDecl']) })
    expect(hidden.missing).not.toContain('Name change declaration (Yes/No)')
  })
})
