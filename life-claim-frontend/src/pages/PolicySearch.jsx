import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { historySearch } from '../services/historySearchService'
import { mapClaimSearchRow } from '../util/claimSearchMap'
import { Search, FileText, Plus, X, RotateCcw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { selectFieldStyle } from '../ui/pageTokens'
import { PremiumGrid, PremiumGridToolbar, PremiumGridScroll, GridStatusBadge } from '../ui/PremiumDataGrid'
import { statusToGridTone } from '../util/statusBadgeTone'


const USER_ROLES = [{ value: 'pre-assessor', label: 'Pre-Assessor' }]

function mapClaimRow(row) {
  return mapClaimSearchRow(row)
}

export default function PolicySearch() {
  const { tokens: T } = useTheme()
  const navigate = useNavigate()
  const toast = useToast()
  const [userRole, setUserRole] = useState('pre-assessor')
  const [policyNumber, setPolicyNumber] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const roleOk = Boolean(userRole)
  const canSearch = roleOk && policyNumber.trim()
  const canRegister = roleOk

  const doSearch = async () => {
    if (!roleOk) {
      toast('warning', 'Select role', 'Choose User Role before searching.')
      return
    }
    if (!policyNumber.trim()) {
      toast('warning', 'Enter criteria', 'Enter a policy number.')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const raw = await historySearch(policyNumber.trim(), '')
      if (!raw || raw.message) {
        setResults([])
        toast('info', 'No records', raw?.message || 'No claims found in history.')
        return
      }
      const arr = Array.isArray(raw) ? raw : [raw]
      setResults(arr.map(mapClaimRow).filter(Boolean))
    } catch {
      setResults([])
      toast('error', 'Search failed', 'Could not load claim history.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUserRole('pre-assessor')
    setPolicyNumber('')
    setResults([])
    setSearched(false)
  }

  const goRegister = (policyNo) => {
    navigate('/registration', { state: { policyNumber: policyNo || policyNumber.trim() } })
  }

  return (
    <AppLayout pageTitle="Policy Search">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Policy Search
          </h1>
          <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px', fontWeight: 500 }}>
            Search existing claims in the system, then register a new claim against a Life Asia policy.
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '16px' }}>Search criteria</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>User role *</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                style={selectFieldStyle(T, { height: '42px', borderRadius: '8px', border: `1.5px solid ${T.border}`, padding: '0 12px', fontSize: '13px' })}
              >
                <option value="">Select role</option>
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Policy number</span>
              <input
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="Policy ID"
                style={{ height: '42px', borderRadius: '8px', border: `1.5px solid ${T.border}`, padding: '0 12px', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              disabled={!canSearch || loading}
              onClick={doSearch}
              style={{ padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: canSearch ? T.primary : '#94A3B8', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: canSearch ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={14} /> {loading ? 'Searching…' : 'Search history'}
            </button>
            <button
              type="button"
              disabled={!canRegister}
              onClick={() => goRegister(policyNumber.trim())}
              style={{ padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: canRegister ? '#059669' : '#94A3B8', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: canRegister ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={14} /> Register new claim
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{ padding: '0 16px', height: '42px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.card, fontSize: '13px', fontWeight: 600, color: T.textSecondary, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Clear
            </button>
          </div>
          <p style={{ fontSize: '11px', color: T.textSubtle, marginTop: '12px' }}>
            Shows claim history for this policy. Full policy details load on the registration form.
          </p>
        </div>

        {!searched ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={32} style={{ color: T.primary, marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>Search claim history</div>
            <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '8px' }}>Or use Register new claim to start without a prior search.</div>
          </div>
        ) : loading ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${T.border}`, borderTopColor: T.primary, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>Searching claim history…</div>
            <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '8px' }}>Please wait while we load matching claims.</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '40px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>
            No matching claims in history.
          </div>
        ) : (
          <PremiumGrid>
            <PremiumGridToolbar>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Results ({results.length})</div>
            </PremiumGridToolbar>
            <PremiumGridScroll>
              <table>
                <thead>
                  <tr>
                    {['Claim number', 'Claim type', 'Policy number', 'Policy status', 'Claim status', 'Created on', 'Created by'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={`${row.claimNumber}-${i}`}>
                      <td><div className="premium-grid__cell-primary">{row.claimNumber}</div></td>
                      <td>{row.claimType}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.policyNumber}</td>
                      <td>{row.policyStatus}</td>
                      <td><GridStatusBadge tone={statusToGridTone(row.claimStatus)}>{row.claimStatus}</GridStatusBadge></td>
                      <td style={{ fontSize: '12px', color: T.textMuted }}>{row.createdOn}</td>
                      <td style={{ fontSize: '12px', color: T.textMuted }}>{row.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PremiumGridScroll>
          </PremiumGrid>
        )}
      </div>
    </AppLayout>
  )
}
