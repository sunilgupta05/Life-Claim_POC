// src/pages/IntegrationHealth.jsx
//
// Integration Health dashboard (roadmap 3.2). Superuser-only. Live per-integration
// status from GET /api/health/integrations — resolved endpoint, circuit-breaker
// state (closed / half-open / open / unknown) and call stats from the 3.1
// resilience layer. Auto-refreshes so an operator can watch a dependency recover.

import { useEffect, useState, useCallback, useRef } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/Toast'
import health from '../services/healthService'
import { Activity, RefreshCw } from 'lucide-react'

const errMsg = (e, fb) => e?.response?.data?.message || e?.message || fb
const REFRESH_MS = 5000

// state -> { label, colour } mapping for the status pill.
const STATE_STYLE = {
  closed:      { label: 'Healthy',    fg: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  'half-open': { label: 'Recovering', fg: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  open:        { label: 'Down',       fg: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  unknown:     { label: 'Idle',       fg: '#3F3F46', bg: '#E4E4E7', dot: '#A1A1AA' },
}

function Pill({ state }) {
  const s = STATE_STYLE[state] || STATE_STYLE.unknown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px',
                   fontSize: '12px', fontWeight: 700, color: s.fg, background: s.bg }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function Stat({ label, value, T }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: 800, color: T.textPrimary }}>{value ?? 0}</div>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: T.textMuted }}>{label}</div>
    </div>
  )
}

export default function IntegrationHealth() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [auto, setAuto] = useState(true)
  const [lastError, setLastError] = useState('')
  const timer = useRef(null)

  const load = useCallback(async (quiet) => {
    if (!quiet) setLoading(true)
    try {
      const res = await health.getIntegrations()
      setData(res)
      setLastError('')
    } catch (e) {
      setLastError(errMsg(e, 'Could not load integration health.'))
      if (!quiet) toast('error', 'Load failed', errMsg(e, 'Could not load integration health.'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load(false) }, [load])

  // Auto-refresh loop.
  useEffect(() => {
    if (!auto) { if (timer.current) clearInterval(timer.current); return }
    timer.current = setInterval(() => load(true), REFRESH_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [auto, load])

  const items = data?.integrations || []
  const degraded = data?.status === 'degraded'
  const wrap = { padding: '20px 24px', maxWidth: '1080px', margin: '0 auto' }
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px 18px' }

  return (
    <AppLayout pageTitle="Integration Health">
      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Activity size={20} style={{ color: T.primary }} />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>Integration Health</h1>
        </div>
        <p style={{ fontSize: '13px', color: T.textMuted, marginTop: 0, marginBottom: '16px' }}>
          Live status of every external dependency, with circuit-breaker state and call stats. Endpoints are editable in{' '}
          <strong>System Settings</strong>.
        </p>

        {/* Overall banner + controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '10px',
                        background: degraded ? '#FEE2E2' : '#D1FAE5', color: degraded ? '#991B1B' : '#065F46', fontWeight: 700, fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: degraded ? '#EF4444' : '#10B981' }} />
            {data ? (degraded ? 'Degraded — a dependency is unavailable' : 'All systems operational') : 'Loading…'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textSecondary, cursor: 'pointer' }}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              Auto-refresh ({REFRESH_MS / 1000}s)
            </label>
            <button type="button" onClick={() => load(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                       border: `1px solid ${T.border}`, background: 'transparent', color: T.textSecondary, fontSize: '13px', fontWeight: 600 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {lastError && (
          <div style={{ ...card, borderColor: '#FCA5A5', background: '#FEF2F2', color: '#991B1B', marginBottom: '14px', fontSize: '13px' }}>
            {lastError}
          </div>
        )}

        {loading && !data ? (
          <div style={{ ...card, textAlign: 'center', color: T.textMuted, padding: '40px' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {items.map((it) => (
              <div key={it.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.textPrimary }}>
                      {it.label}{it.critical && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#B45309', fontWeight: 700 }}>CRITICAL</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px' }}>{it.usedFor}</div>
                  </div>
                  <Pill state={it.state} />
                </div>

                <div style={{ fontSize: '12px', color: T.textSecondary, marginBottom: '10px', wordBreak: 'break-all' }}>
                  <span style={{ color: T.textMuted }}>Endpoint: </span><code>{it.endpoint || '—'}</code>
                  {it.timeoutMs ? <span style={{ color: T.textMuted }}> · timeout {it.timeoutMs}ms</span> : null}
                </div>

                {it.stats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', paddingTop: '10px', borderTop: `1px solid ${T.borderSubtle}` }}>
                    <Stat label="Calls" value={it.stats.fires} T={T} />
                    <Stat label="OK" value={it.stats.successes} T={T} />
                    <Stat label="Fail" value={it.stats.failures} T={T} />
                    <Stat label="Timeout" value={it.stats.timeouts} T={T} />
                    <Stat label="Rejected" value={it.stats.rejects} T={T} />
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: T.textSubtle, paddingTop: '10px', borderTop: `1px solid ${T.borderSubtle}` }}>
                    No calls recorded yet.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data?.generatedAt && (
          <div style={{ fontSize: '11px', color: T.textSubtle, marginTop: '14px', textAlign: 'right' }}>
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
