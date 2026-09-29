/**
 * Runtime brand theming (roadmap 2.1).
 *
 * The org's colours live in config (org_profile → COMPANY.colors, hydrated at
 * startup). This applies them to the live CSS variables so the whole app
 * re-brands at runtime, replacing the hardcoded values in index.css. A tiny
 * listener registry lets ThemeContext re-render (so JS-token inline styles like
 * T.primary also pick up the change) after startup hydration or an admin save.
 *
 * Non-breaking: with no configured colours the index.css defaults stand, so the
 * shipped look is unchanged until an admin edits branding.
 */
import { COMPANY } from './companyBrand'

const listeners = new Set()

/** Subscribe to brand-colour changes; returns an unsubscribe fn. */
export function onBrandChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  for (const fn of listeners) {
    try { fn() } catch { /* ignore listener errors */ }
  }
}

/**
 * Apply a colour palette to the document's CSS variables. Only sets a variable
 * when the colour is present, so missing keys keep their index.css default.
 */
export function applyBrandColors(colors = COMPANY.colors, { silent = false } = {}) {
  if (typeof document === 'undefined' || !colors || typeof colors !== 'object') return
  const root = document.documentElement
  const set = (name, val) => { if (val) root.style.setProperty(name, val) }

  // Primary drives buttons, links, active nav; accent is the secondary brand hue.
  set('--primary', colors.primary)
  set('--primary-hover', colors.primaryHover)
  set('--primary-light', colors.primaryLight)
  set('--accent', colors.accent)
  set('--accent-bg', colors.accentBg)
  set('--accent-border', colors.accentBorder)
  set('--text-primary', colors.text)
  set('--text-muted', colors.muted)
  set('--border', colors.border)
  set('--topbar-bg', colors.headerBg)

  if (!silent) notify()
}
