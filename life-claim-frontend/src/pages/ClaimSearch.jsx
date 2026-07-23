import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { claimSearch } from '../services/claimSearchService'
import { mapClaimSearchRow } from '../util/claimSearchMap'
import { openClaimWorkspace } from '../util/navigation'
import { Search, Eye, X, RotateCcw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { PremiumGrid, PremiumGridToolbar, PremiumGridScroll, GridStatusBadge } from '../ui/PremiumDataGrid'
import { statusToGridTone } from '../util/statusBadgeTone'
import HelpLink from '../components/HelpLink'


export default function ClaimSearch() {
  const { tokens: T } = useTheme()
  const navigate = useNavigate()
  const toast = useToast()
  const [claimNumber, setClaimNumber] = useState('')
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const doSearch = async () => {
    const num = claimNumber.trim()
    if (!num) {
      toast('warning', 'Claim number required', 'Enter a claim number to search.')
      return
    }
    setLoading(true)
    setSearched(true)
    setResult(null)
    try {
      const raw = await claimSearch.claimSearchNumber(num)
      const row = mapClaimSearchRow(raw)
      if (!row?.claimNumber) {
        toast('info', 'Not found', 'No claim found with that number.')
        return
      }
      setResult(row)
    } catch {
      toast('error', 'Search failed', 'Could not search claims.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setClaimNumber('')
    setResult(null)
    setSearched(false)
  }

  const handleView = () => {
    if (!result?.claimNumber) return
    openClaimWorkspace(navigate, result.claimNumber, { from: 'claimSearch' })
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') doSearch() }

  return (
    <AppLayout pageTitle="Claim Search">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Claim Search
          </h1>
          <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px', fontWeight: 500 }}>
            Find a claim by number and open the workspace in browse mode.
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '16px' }}>Search by claim number</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '42px', borderRadius: '8px', background: T.inputBg, border: `1.5px solid ${T.border}` }}>
              <Search size={15} style={{ color: T.textSubtle, flexShrink: 0 }} />
              <input
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. CL123"
                style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '13px', color: T.textPrimary, fontWeight: 500, fontFamily: 'Inter,sans-serif' }}
              />
              {claimNumber && (
                <button type="button" onClick={() => setClaimNumber('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSubtle, display: 'flex', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={doSearch}
              disabled={loading}
              style={{ padding: '0 24px', height: '42px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={14} /> {loading ? 'Searching…' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{ padding: '0 16px', height: '42px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.inputBg, fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textSecondary, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Clear
            </button>
          </div>
          <p style={{ fontSize: '12px', color: T.textSubtle, marginTop: '12px', lineHeight: 1.5 }}>
            View Claim opens read-only browse mode. To work a claim, use <strong>My Task</strong> after pool assignment.
          </p>
        </div>

        {!searched ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '48px 24px', textAlign: 'center' }}>
            <Search size={28} style={{ color: T.primary, margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>Enter a claim number</div>
            <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '6px' }}>Search by claim number to view claim details.</div>
            <HelpLink questionId="cw-open">How do I open a claim?</HelpLink>
          </div>
        ) : !result ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '48px 24px', textAlign: 'center', color: T.textMuted, fontSize: '14px', fontWeight: 600 }}>
            No claim found for &ldquo;{claimNumber.trim()}&rdquo;
            <div>
              <HelpLink questionId="cw-open">Tips for finding claims</HelpLink>
            </div>
          </div>
        ) : (
          <PremiumGrid>
            <PremiumGridToolbar>
              <div style={{ fontSize: '13px', fontWeight: 700, color: T.textPrimary }}>Claim found</div>
            </PremiumGridToolbar>
            <PremiumGridScroll>
              <table>
                <thead>
                  <tr>
                    {['Claim Number', 'Claim Type', 'Policy Number', 'Policy Status', 'Claim Status', 'Role', 'Created On', 'Created By', 'Action'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><div className="premium-grid__cell-primary">{result.claimNumber}</div></td>
                    <td>{result.claimType}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{result.policyNumber}</td>
                    <td>{result.policyStatus}</td>
                    <td><GridStatusBadge tone={statusToGridTone(result.claimStatus)}>{result.claimStatus}</GridStatusBadge></td>
                    <td>{result.claimRole}</td>
                    <td style={{ fontSize: '12px', color: T.textMuted }}>{result.createdOn}</td>
                    <td style={{ fontSize: '12px', color: T.textMuted }}>{result.createdBy}</td>
                    <td>
                      <button
                        type="button"
                        onClick={handleView}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
                      >
                        <Eye size={14} /> View Claim
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </PremiumGridScroll>
          </PremiumGrid>
        )}
      </div>
    </AppLayout>
  )
}
