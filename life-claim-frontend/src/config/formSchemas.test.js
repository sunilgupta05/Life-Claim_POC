import { describe, it, expect } from 'vitest'
import { applyFieldOverrides, getBaseFields, listForms } from './formSchemas'

const base = [
  { name: 'a', label: 'A', required: false },
  { name: 'b', label: 'B', required: true },
]

describe('applyFieldOverrides (roadmap 2.3)', () => {
  it('hides a field when visible=false', () => {
    const out = applyFieldOverrides(base, { a: { visible: false, required: null } })
    expect(out.find((f) => f.name === 'a').hidden).toBe(true)
    expect(out.find((f) => f.name === 'b').hidden).toBeUndefined()
  })

  it('overrides required, and inherits the base default on null', () => {
    const out = applyFieldOverrides(base, { a: { visible: true, required: true }, b: { visible: true, required: null } })
    expect(out.find((f) => f.name === 'a').required).toBe(true)  // overridden
    expect(out.find((f) => f.name === 'b').required).toBe(true)  // inherited base
  })

  it('can force a required field to optional', () => {
    const out = applyFieldOverrides(base, { b: { visible: true, required: false } })
    expect(out.find((f) => f.name === 'b').required).toBe(false)
  })

  it('no overrides ⇒ base unchanged', () => {
    expect(applyFieldOverrides(base, {})).toEqual(base)
    expect(applyFieldOverrides(base, null)).toEqual(base)
  })
})

describe('form registry', () => {
  it('lists the configurable forms with their field supersets', () => {
    const forms = listForms()
    expect(forms.length).toBeGreaterThan(0)
    const iib = forms.find((f) => f.key === 'registration.iib')
    expect(iib).toBeTruthy()
    expect(getBaseFields('registration.iib').length).toBeGreaterThan(0)
  })
})
