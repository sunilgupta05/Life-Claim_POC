import { describe, it, expect, vi, afterEach } from 'vitest'
import { applyBrandColors, onBrandChange } from './brandTheme'

afterEach(() => {
  // clear any inline vars we set
  document.documentElement.removeAttribute('style')
})

describe('applyBrandColors (roadmap 2.1)', () => {
  it('sets the brand CSS variables from the palette', () => {
    applyBrandColors({ primary: '#123456', accent: '#abcdef' }, { silent: true })
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#123456')
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#abcdef')
  })

  it('only sets provided colours (missing keys keep their default)', () => {
    applyBrandColors({ primary: '#000000' }, { silent: true })
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#000000')
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('') // untouched
  })

  it('does not throw on empty / missing input', () => {
    expect(() => applyBrandColors({}, { silent: true })).not.toThrow()
    expect(() => applyBrandColors(null)).not.toThrow()
    expect(() => applyBrandColors(undefined)).not.toThrow()
  })

  it('notifies listeners unless silent', () => {
    const fn = vi.fn()
    const off = onBrandChange(fn)
    applyBrandColors({ primary: '#010101' })
    expect(fn).toHaveBeenCalledTimes(1)
    applyBrandColors({ primary: '#020202' }, { silent: true })
    expect(fn).toHaveBeenCalledTimes(1) // silent → no extra notify
    off()
    applyBrandColors({ primary: '#030303' })
    expect(fn).toHaveBeenCalledTimes(1) // unsubscribed
  })
})
