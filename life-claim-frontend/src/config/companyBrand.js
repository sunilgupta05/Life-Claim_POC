/** Dark Horse Digital — shared branding for login, PDFs, and reports.
 *
 * Roadmap 0.2: these values are now DEFAULTS. At startup the app calls
 * hydrateCompanyBrand(), which fetches this deployment's org profile from
 * GET /api/org-profile and overlays it onto COMPANY in place. If that endpoint
 * is unavailable, not yet provisioned, or returns nothing, these defaults stand
 * — so behaviour is identical to before until an org is configured in the DB.
 *
 * COMPANY is a single mutable object; every importer reads the same reference,
 * so overlaying it here updates the whole app (main.jsx re-renders once if the
 * loaded profile actually differs from these defaults).
 */
import { API_URL } from '../util/config'

export const COMPANY = {
  name: 'Dark Horse Digital',
  code: 'DHDIGITAL',
  product: 'Life Claims Platform',
  tagline: 'Driving Digital Transformation',
  email: 'claimssupport@dhdigital.co.in',
  phone: '+91 98923 94104',
  website: 'www.dhdigital.co.in',
  logoPath: '/company-logo.png',
  locale: 'en-IN',
  enabledModules: [
    'dashboard', 'superuser-overview', 'superuser-claims', 'policy',
    'claims', 'pool', 'tasks', 'add', 'audit-log',
  ],
  colors: {
    primary: '#1D4ED8',
    accent: '#8B1A2B',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    headerBg: '#F8FAFC',
  },
}

/**
 * Fetch the active org profile and overlay it onto COMPANY.
 * Best-effort and non-throwing. Returns true only if COMPANY actually changed
 * (so the caller can decide whether a re-render is worthwhile).
 */
export async function hydrateCompanyBrand() {
  try {
    const res = await fetch(`${API_URL || ''}/api/org-profile`, {
      credentials: 'include',
    })
    if (!res.ok) return false
    const p = await res.json()
    if (!p || typeof p !== 'object') return false

    const before = JSON.stringify(COMPANY)
    const set = (key, val) => {
      if (val !== undefined && val !== null && val !== '') COMPANY[key] = val
    }
    set('name', p.name)
    set('code', p.code)
    set('product', p.product)
    set('tagline', p.tagline)
    set('email', p.email)
    set('phone', p.phone)
    set('website', p.website)
    set('logoPath', p.logoPath)
    set('locale', p.locale)
    if (Array.isArray(p.enabledModules)) COMPANY.enabledModules = p.enabledModules
    if (p.colors && typeof p.colors === 'object') {
      COMPANY.colors = { ...COMPANY.colors, ...p.colors }
    }
    return JSON.stringify(COMPANY) !== before
  } catch {
    // Network error / backend down / CORS — keep defaults, never break boot.
    return false
  }
}
