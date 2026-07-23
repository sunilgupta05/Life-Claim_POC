import { useEffect, useState, useMemo } from 'react'
import { percentOf, withDisplayPercents } from '../util/percentDisplay'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import adminService from '../services/adminService'
import {
  AlertTriangle, Clock, Users, FileText, ClipboardList,
  Layers, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { outlineButtonStyle, metricCardTokens, statusPillStyle } from '../ui/pageTokens'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'


const GRID_4 = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }
const GRID_2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <p style={{ color: '#94A3B8', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.fill || p.stroke, flexShrink: 0 }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function Panel({ children, style }) {
  const { tokens: T } = useTheme()
  return (
    <div style={{
      background: T.card,
      borderRadius: '12px',
      border: `1px solid ${T.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      ...style,
    }}>
      {children}
    </div>
  )
}

function PanelHeader({ title, subtitle, right }) {
  const { tokens: T } = useTheme()
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: `1px solid ${T.borderSubtle}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexShrink: 0,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary }}>{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px', fontWeight: 500 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

export default function AdminOverview() {
  const { tokens: T } = useTheme()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const SLA_VIEWS = useMemo(() => [
    { view: 'slaBreached', label: 'SLA breached (>3 days)', color: '#DC2626', icon: AlertTriangle },
    { view: 'slaAtRisk', label: 'SLA at risk (1–3 days)', color: '#D97706', icon: Clock },
    { view: 'openByRole', label: 'Open by role', color: T.primary, icon: Users },
    { view: 'rejected30d', label: 'Rejected (30 days)', color: '#64748B', icon: FileText },
  ], [T.primary])

  const KPI_CONFIG = useMemo(() => [
    { label: 'Total claims', key: 'totalClaims', icon: Layers, tone: 'info' },
    { label: 'Pending', key: 'pending', icon: Clock, tone: 'warn' },
    { label: 'Approved', key: 'approved', icon: CheckCircle, tone: 'success' },
    { label: 'Rejected', key: 'rejected', icon: XCircle, tone: 'danger' },
  ], [])

  useEffect(() => {
    adminService.getSummary().then(setSummary).finally(() => setLoading(false))
  }, [])

  const s = summary || {}
  const last30Total = s.quality?.last30Total ?? 0
  const last30Rejected = s.quality?.last30Rejected ?? 0
  const rejectionPct = last30Total > 0
    ? `${percentOf(last30Rejected, last30Total)}%`
    : '—'

  const pieDataRaw = useMemo(() => [
    { name: 'Approved', value: s.approved || 0, color: '#059669' },
    { name: 'Pending', value: s.pending || 0, color: '#D97706' },
    { name: 'Rejected', value: s.rejected || 0, color: '#DC2626' },
  ].filter((d) => d.value > 0), [s.approved, s.pending, s.rejected])

  const statusSplitTotal = (s.pending || 0) + (s.approved || 0) + (s.rejected || 0)

  const pieData = useMemo(
    () => withDisplayPercents(pieDataRaw, statusSplitTotal),
    [pieDataRaw, statusSplitTotal]
  )

  const workloadData = useMemo(() => [
    { name: 'Pre Assessor', value: s.workload?.preAssessorOpen || 0, fill: '#7C3AED' },
    { name: 'Assessor', value: s.workload?.assessorOpen || 0, fill: '#1D4ED8' },
    { name: 'Verifier', value: s.workload?.verifierOpen || 0, fill: '#0891B2' },
  ], [s.workload])

  const slaChartData = useMemo(() => {
    const breached = s.sla?.breached || 0
    const atRisk = s.sla?.atRisk || 0
    const pendingTotal = s.pending || 0
    const onTrack = Math.max(0, pendingTotal - breached - atRisk)
    const rows = [
      { name: 'Breached', value: breached, fill: '#DC2626' },
      { name: 'At risk', value: atRisk, fill: '#D97706' },
      { name: 'On track', value: onTrack, fill: '#059669' },
    ].filter((d) => d.value > 0)
    return withDisplayPercents(rows, pendingTotal, 'value')
  }, [s.sla, s.pending])

  const claimTypesRaw = s.charts?.claimTypes?.length
    ? s.charts.claimTypes
    : [{ name: 'No data', value: 0, color: '#E2E8F0' }]

  const claimTypeTotal = claimTypesRaw.reduce((sum, d) => sum + (d.value || 0), 0)

  const claimTypes = useMemo(
    () => withDisplayPercents(claimTypesRaw, claimTypeTotal),
    [claimTypesRaw, claimTypeTotal]
  )

  const totalClaims = s.totalClaims || 0
  const pieDisplay = pieData.length ? pieData : [{ name: 'No data', value: 1, color: '#E2E8F0' }]

  return (
    <AppLayout pageTitle="Super User Overview" pageSubtitle="Platform KPIs and SLA drill-downs">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: T.textPrimary }}>Super User Overview</h1>
          <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>
            Platform-wide claim metrics and SLA workload drill-downs.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading summary…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Primary KPIs — 4 equal columns */}
            <div style={GRID_4}>
              {KPI_CONFIG.map((k) => {
                const Icon = k.icon
                const value = s[k.key] ?? 0
                const tok = metricCardTokens(T, k.tone)
                return (
                  <Panel key={k.label}>
                    <div style={{ padding: '16px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tok.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                        <Icon size={17} style={{ color: tok.color }} />
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: tok.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '6px', fontWeight: 600 }}>{k.label}</div>
                    </div>
                  </Panel>
                )
              })}
            </div>

            {/* Secondary stats — same 4-column grid */}
            <div style={GRID_4}>
              {[
                { label: 'Registered (7d)', value: s.registeredThisWeek },
                { label: 'Today registered', value: s.today?.registered },
                { label: 'Today closed', value: s.today?.closed },
                { label: 'Rejection rate (30d)', value: rejectionPct, detail: last30Total > 0 ? `${last30Rejected} of ${last30Total}` : null, color: '#7C3AED' },
              ].map((k) => (
                <Panel key={k.label}>
                  <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: k.color || T.textPrimary, lineHeight: 1 }}>{k.value ?? 0}</div>
                    {k.detail && (
                      <div style={{ fontSize: '10px', color: T.textSubtle, marginTop: '4px', fontWeight: 600 }}>{k.detail}</div>
                    )}
                    <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '6px', fontWeight: 600 }}>{k.label}</div>
                  </div>
                </Panel>
              ))}
            </div>

            {/* Status split + claim type — 2 equal columns */}
            <div style={GRID_2}>
              <Panel>
                <PanelHeader title="Status split" subtitle={`${statusSplitTotal} claims`} />
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieDisplay} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value">
                        {pieDisplay.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(pieData.length ? pieData : [{ name: 'No data', value: 0, color: '#E2E8F0' }]).map((d) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '9px', height: '9px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: T.textSecondary, fontWeight: 500 }}>{d.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: T.textPrimary }}>{d.value}</span>
                          <span style={{ fontSize: '10px', color: T.textSubtle }}>
                            {d.pct ?? 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="By claim type" subtitle={`${claimTypeTotal || totalClaims} claims`} />
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px' }}>
                  {claimTypes.map((d) => (
                    <div key={d.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>{d.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: T.textPrimary }}>{d.value}</span>
                      </div>
                        <div style={{ height: '6px', borderRadius: '99px', background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '99px', background: d.color, width: `${d.pct ?? 0}%` }} />
                      </div>
                      <div style={{ fontSize: '10px', color: T.textSubtle, marginTop: '4px', fontWeight: 500 }}>
                        {d.pct ?? 0}% of claims
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Workload + SLA — 2 equal columns */}
            <div style={GRID_2}>
              <Panel>
                <PanelHeader
                  title="Open workload by role"
                  subtitle={`${(s.workload?.preAssessorOpen || 0) + (s.workload?.assessorOpen || 0) + (s.workload?.verifierOpen || 0)} of ${s.pending || 0} pending`}
                />
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={workloadData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                      <Bar dataKey="value" name="Open claims" radius={[6, 6, 0, 0]}>
                        {workloadData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="SLA health"
                  subtitle={`${s.pending || 0} pending claims`}
                  right={(
                    <div style={statusPillStyle(T, 'success', { padding: '3px 8px' })}>
                      <TrendingUp size={10} /> {s.pending || 0} pending
                    </div>
                  )}
                />
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={slaChartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                      <Bar dataKey="value" name="Claims" radius={[6, 6, 0, 0]}>
                        {slaChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            {/* Drill-down — 4 equal columns */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: T.textPrimary }}>SLA & workload drill-down</div>
              <div style={GRID_4}>
                {SLA_VIEWS.map(({ view, label, color, icon: Icon }) => {
                  const count = view === 'slaBreached' ? s.sla?.breached
                    : view === 'slaAtRisk' ? s.sla?.atRisk
                    : view === 'rejected30d' ? (s.rejected30dClaims?.length ?? s.quality?.last30Rejected)
                    : (s.openByRoleClaims?.length ?? s.pending)
                  return (
                    <button
                      key={view}
                      type="button"
                      onClick={() => navigate(`/superuser/workload?view=${view}`)}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        height: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Icon size={18} style={{ color }} />
                        <span style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary }}>{label}</span>
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color }}>{count ?? 0}</div>
                      <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '6px' }}>View list →</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <Link
                to="/superuser/claim-search"
                style={{ ...outlineButtonStyle(T, { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', background: T.primaryLight, color: T.primary, fontWeight: 700, fontSize: '13px', textDecoration: 'none', border: `1px solid ${T.primaryBorder}` }) }}
              >
                <FileText size={16} /> Claim assignment
              </Link>
              <Link
                to="/audit-log"
                style={{ ...outlineButtonStyle(T, { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }) }}
              >
                <ClipboardList size={16} /> Login sessions
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
