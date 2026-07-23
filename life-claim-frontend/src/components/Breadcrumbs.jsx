import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  'policy-search': 'Policy Search',
  'claim-search': 'Claim Search',
  registration: 'Register Claim',
  'claim-view': 'Claim View',
  'registration-fetch': 'Claim Workspace',
  'pool-selection': 'Pool Selection',
  'my-task': 'My Tasks',
  'add-screen': 'Advance Intelligence',
  'user-management': 'User Management',
  'audit-log': 'Login Sessions',
  superuser: 'Super User Overview',
  'superuser/claim-search': 'Claim Assignment',
  'superuser/workload': 'Workload list',
  admin: 'Super User Overview',
  'admin/claim-search': 'Claim Assignment',
  'admin-reports': 'Super User Overview',
  profile: 'My Profile',
  case: 'Case Details',
  'add-case': 'Case Details',
}

export function buildCrumbs(pathname, params) {
  if (pathname.startsWith('/registration-fetch')) {
    return [
      { label: 'Claim Search', path: '/claim-search' },
      { label: 'View Claim', path: pathname, last: true },
    ]
  }

  if (pathname === '/add-case' || pathname.startsWith('/case/')) {
    return [
      { label: 'Advance Intelligence', path: '/add-screen' },
      { label: 'Case Details', path: '/add-case', last: true },
    ]
  }

  if (pathname.startsWith('/registration')) {
    return [
      { label: 'Policy Search', path: '/policy-search' },
      { label: 'New Registration', path: pathname, last: true },
    ]
  }

  if (pathname.startsWith('/claim-view/')) {
    const id = params.claimId || pathname.split('/').pop()
    return [
      { label: 'Claim Search', path: '/claim-search' },
      { label: 'Claim View', path: pathname, last: true, detail: id },
    ]
  }

  // Superuser sidebar entries are top-level — not nested under Overview.
  if (pathname.startsWith('/superuser/claim-search') || pathname.startsWith('/admin/claim-search')) {
    return [{ label: 'Claim Assignment', path: pathname, last: true }]
  }
  if (pathname.startsWith('/superuser/workload')) {
    return [{ label: 'Workload list', path: pathname, last: true }]
  }
  if (pathname === '/audit-log' || pathname.startsWith('/admin/audit')) {
    return [{ label: 'Login Sessions', path: '/audit-log', last: true }]
  }
  if (pathname === '/superuser' || pathname === '/admin' || pathname === '/admin-reports') {
    return [{ label: 'Super User Overview', path: pathname, last: true }]
  }

  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const compositeKey = segments.slice(0, i + 1).join('/')
    let label = ROUTE_LABELS[compositeKey] || ROUTE_LABELS[seg]
    if (!label && seg === 'admin') label = 'Super User Overview'
    if (!label && seg.startsWith('CL')) label = seg
    if (!label) {
      label = seg.replace(/-/g, ' ')
      if (label.toLowerCase() === 'admin') label = 'Super User Overview'
      else label = label.replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return { label, path, last: i === segments.length - 1 }
  })
}

export function BreadcrumbTrail({ fallbackLabel }) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const { tokens: T, isDark } = useTheme()

  if (location.pathname === '/login') return null

  const crumbs = buildCrumbs(location.pathname, params)
  if (!crumbs.length) {
    if (!fallbackLabel) return null
    return (
      <span style={{ fontSize: '13px', fontWeight: 700, color: T.textSecondary }}>{fallbackLabel}</span>
    )
  }

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', minWidth: 0 }}>
      {crumbs.map((c, i) => (
        <div key={`${c.path}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {i > 0 && <ChevronRight size={13} style={{ color: T.crumbDivider, flexShrink: 0 }} />}
          {c.last ? (
            <span style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary }}>
              {c.label}
              {c.detail ? <span style={{ color: T.textMuted, fontWeight: 600 }}> · {c.detail}</span> : null}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => navigate(c.path)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: T.textMuted,
                fontFamily: 'Inter,sans-serif',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.primary }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted }}
            >
              {c.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
