import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import adminService from '../services/adminService'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { PremiumGrid, PremiumGridScroll, PremiumGridFooter } from '../ui/PremiumDataGrid'


const VIEW_LABELS = {
  slaBreached: 'SLA breached (>3 days pending)',
  slaAtRisk: 'SLA at risk (1–3 days pending)',
  openByRole: 'Open / pending by role',
  rejected30d: 'Rejected in last 30 days',
}

const SUMMARY_KEYS = {
  slaBreached: 'slaBreachedClaims',
  slaAtRisk: 'slaAtRiskClaims',
  openByRole: 'openByRoleClaims',
  rejected30d: 'rejected30dClaims',
}

const PAGE_SIZE = 10

export default function AdminWorkloadList() {
  const { tokens: T } = useTheme()
  const [params] = useSearchParams()
  const view = params.get('view') || ''
  const validView = Boolean(VIEW_LABELS[view])
  const toast = useToast()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const loadClaims = useCallback(async () => {
    if (!validView) return
    setLoading(true)
    try {
      let list = await adminService.getRecentClaims({ limit: 500, view })
      if (!list?.length) {
        const summary = await adminService.getSummary()
        list = summary?.[SUMMARY_KEYS[view]] || []
      }
      setClaims(Array.isArray(list) ? list : [])
      setPage(0)
    } catch (e) {
      toast('error', 'Load failed', e?.message || 'Could not load claims.')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }, [view, validView, toast])

  useEffect(() => {
    loadClaims()
  }, [loadClaims])

  if (!validView) {
    return <Navigate to="/superuser" replace />
  }

  const totalPages = Math.max(1, Math.ceil(claims.length / PAGE_SIZE))
  const pageClaims = claims.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <AppLayout pageTitle="Workload list" pageSubtitle={VIEW_LABELS[view]}>
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <Link
          to="/superuser"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: T.textMuted, textDecoration: 'none', marginBottom: '16px' }}
        >
          <ArrowLeft size={14} /> Back to overview
        </Link>

        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: T.textPrimary }}>{VIEW_LABELS[view]}</h1>
        <p style={{ fontSize: '13px', color: T.textMuted, marginBottom: '20px' }}>
          Read-only list · {claims.length} claim{claims.length === 1 ? '' : 's'}
        </p>

        {loading ? (
          <div style={{ padding: '32px', color: T.textMuted }}>Loading claims…</div>
        ) : claims.length === 0 ? (
          <div style={{ padding: '32px', color: T.textMuted }}>No claims for this view.</div>
        ) : (
          <PremiumGrid>
            <PremiumGridScroll>
              <table>
                <thead>
                  <tr>
                    {['Claim', 'Policy', 'Status', 'Role', 'Assigned'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageClaims.map((c) => {
                    const cn = c.claimNumber || c.CLAIM_NUMBER
                    return (
                      <tr key={cn}>
                        <td><div className="premium-grid__cell-primary">{cn}</div></td>
                        <td style={{ fontSize: '12px' }}>{c.policyNumber || c.POLICY_NUMBER || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{c.status || c.STATUS}</td>
                        <td style={{ fontSize: '12px' }}>{c.role || c.ROLE || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{c.assignedTo || c.ASSIGNED_TO || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </PremiumGridScroll>
            {totalPages > 1 && (
              <PremiumGridFooter>
                <span>Page {page + 1} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="premium-grid__pill">Prev</button>
                  <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} className="premium-grid__pill">Next</button>
                </div>
              </PremiumGridFooter>
            )}
          </PremiumGrid>
        )}
      </div>
    </AppLayout>
  )
}
