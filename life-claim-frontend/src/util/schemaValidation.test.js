import { describe, it, expect } from 'vitest'
import { validateSchema } from './schemaValidation'

const fields = [
  { name: 'a', label: 'A', required: true },
  { name: 'b', label: 'B', maxLength: 3 },
  { name: 'c', label: 'C', hidden: true, required: true }, // hidden ⇒ never validated
  { name: 'd', label: 'D', pattern: { value: /^\d+$/, message: 'digits only' } },
]

describe('validateSchema (roadmap 2.3 validation engine)', () => {
  it('flags a missing required field', () => {
    const r = validateSchema(fields, {})
    expect(r.valid).toBe(false)
    expect(r.errors.map((e) => e.name)).toContain('a')
  })

  it('passes when required fields are filled', () => {
    expect(validateSchema(fields, { a: 'x' }).valid).toBe(true)
  })

  it('never requires a hidden field', () => {
    const r = validateSchema(fields, { a: 'x' })
    expect(r.errors.find((e) => e.name === 'c')).toBeUndefined()
  })

  it('enforces maxLength', () => {
    const r = validateSchema(fields, { a: 'x', b: 'toolong' })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.name === 'b')).toBe(true)
  })

  it('enforces pattern only when a value is present', () => {
    expect(validateSchema(fields, { a: 'x', d: '' }).valid).toBe(true)      // optional+empty ok
    const bad = validateSchema(fields, { a: 'x', d: 'abc' })
    expect(bad.valid).toBe(false)
    expect(bad.errors.find((e) => e.name === 'd').message).toBe('digits only')
  })
})
